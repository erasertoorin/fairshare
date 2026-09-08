import { Injectable, computed, signal } from '@angular/core';
import { Subject, switchMap, tap, catchError, EMPTY, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Group, GroupDetail, Expense, Balance, ExpenseCategory } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class GroupStore {
  // State signals
  readonly groups = signal<Group[]>([]);
  readonly currentGroup = signal<GroupDetail | null>(null);
  readonly expenses = signal<Expense[]>([]);
  readonly balances = signal<Balance[]>([]);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(false);

  // Computed
  readonly sortedExpenses = computed(() =>
    [...this.expenses()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  readonly totalGroupExpenses = computed(() =>
    this.expenses().reduce((sum, e) => sum + e.amount, 0)
  );

  // Action subjects (RxJS event streams)
  private readonly loadGroups$ = new Subject<void>();
  private readonly loadGroupDetail$ = new Subject<string>();
  private readonly addExpense$ = new Subject<{ groupId: string; data: Parameters<ApiService['createExpense']>[1] }>();
  private readonly editExpense$ = new Subject<{ expenseId: string; groupId: string; data: Partial<Expense> }>();

  constructor(private api: ApiService, private auth: AuthService) {
    // Load groups stream
    this.loadGroups$.pipe(
      tap(() => this.loading.set(true)),
      switchMap(() => {
        const userId = this.auth.currentUserId();
        if (!userId) return EMPTY;
        return this.api.getGroups(userId).pipe(
          tap(groups => {
            this.groups.set(groups);
            this.loading.set(false);
          }),
          catchError(() => {
            this.loading.set(false);
            return EMPTY;
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe();

    // Load group detail stream
    this.loadGroupDetail$.pipe(
      tap(() => this.loading.set(true)),
      switchMap(groupId =>
        forkJoin({
          group: this.api.getGroup(groupId),
          expenses: this.api.getExpenses(groupId),
          balances: this.api.getBalances(groupId),
          categories: this.api.getCategories(),
        }).pipe(
          tap(({ group, expenses, balances, categories }) => {
            this.currentGroup.set(group);
            this.expenses.set(expenses);
            this.balances.set(balances);
            this.categories.set(categories);
            this.loading.set(false);
          }),
          catchError(() => {
            this.loading.set(false);
            return EMPTY;
          }),
        )
      ),
      takeUntilDestroyed(),
    ).subscribe();

    // Add expense stream
    this.addExpense$.pipe(
      switchMap(({ groupId, data }) =>
        this.api.createExpense(groupId, data).pipe(
          switchMap(() => forkJoin({
            expenses: this.api.getExpenses(groupId),
            balances: this.api.getBalances(groupId),
          })),
          tap(({ expenses, balances }) => {
            this.expenses.set(expenses);
            this.balances.set(balances);
          }),
          catchError(() => EMPTY),
        )
      ),
      takeUntilDestroyed(),
    ).subscribe();

    // Edit expense stream
    this.editExpense$.pipe(
      switchMap(({ expenseId, groupId, data }) =>
        this.api.updateExpense(expenseId, data).pipe(
          switchMap(() => forkJoin({
            expenses: this.api.getExpenses(groupId),
            balances: this.api.getBalances(groupId),
          })),
          tap(({ expenses, balances }) => {
            this.expenses.set(expenses);
            this.balances.set(balances);
          }),
          catchError(() => EMPTY),
        )
      ),
      takeUntilDestroyed(),
    ).subscribe();
  }

  // Public actions
  loadGroups(): void {
    this.loadGroups$.next();
  }

  loadGroupDetail(groupId: string): void {
    this.loadGroupDetail$.next(groupId);
  }

  addExpense(groupId: string, data: Parameters<ApiService['createExpense']>[1]): void {
    this.addExpense$.next({ groupId, data });
  }

  editExpense(expenseId: string, groupId: string, data: Partial<Expense>): void {
    this.editExpense$.next({ expenseId, groupId, data });
  }

  getUserName(userId: string): string {
    return this.currentGroup()?.memberDetails.find(m => m.userId === userId)?.user.name ?? 'Unbekannt';
  }

  getUserColor(userId: string): string {
    return this.currentGroup()?.memberDetails.find(m => m.userId === userId)?.user.avatarColor ?? '#9E9E9E';
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.icon ?? 'receipt';
  }
}

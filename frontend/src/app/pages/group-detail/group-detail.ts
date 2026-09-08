import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { GroupDetail, Expense, Balance, User, ExpenseCategory } from '../../models/api.models';
import { AddExpenseDialog } from '../../components/add-expense-dialog/add-expense-dialog';

@Component({
  selector: 'app-group-detail',
  imports: [CurrencyPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatTabsModule, MatChipsModule, MatDialogModule],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetailPage implements OnInit {
  group: GroupDetail | null = null;
  expenses: Expense[] = [];
  balances: Balance[] = [];
  categories: ExpenseCategory[] = [];
  private usersMap = new Map<string, User>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    protected auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const groupId = this.route.snapshot.paramMap.get('id');
    if (groupId) this.loadGroup(groupId);
  }

  loadGroup(groupId: string): void {
    forkJoin({
      group: this.api.getGroup(groupId),
      expenses: this.api.getExpenses(groupId),
      balances: this.api.getBalances(groupId),
      categories: this.api.getCategories(),
    }).subscribe(({ group, expenses, balances, categories }) => {
      this.group = group;
      this.expenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.balances = balances;
      this.categories = categories;
      for (const m of group.memberDetails) {
        this.usersMap.set(m.userId, m.user);
      }
    });
  }

  getUserName(userId: string): string {
    return this.usersMap.get(userId)?.name ?? 'Unbekannt';
  }

  getUserColor(userId: string): string {
    return this.usersMap.get(userId)?.avatarColor ?? '#9E9E9E';
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.icon ?? 'receipt';
  }

  getSharePerPerson(expense: Expense): number {
    return expense.amount / expense.splitBetween.length;
  }

  openAddExpense(): void {
    if (!this.group) return;
    const ref = this.dialog.open(AddExpenseDialog, {
      width: '450px',
      data: { group: this.group, categories: this.categories },
    });
    ref.afterClosed().subscribe(result => {
      if (result && this.group) this.loadGroup(this.group.id);
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

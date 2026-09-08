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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { GroupStore } from '../../services/group.store';
import { Balance, Expense } from '../../models/api.models';
import { AddExpenseDialog } from '../../components/add-expense-dialog/add-expense-dialog';
import { AddMemberDialog } from '../../components/add-member-dialog/add-member-dialog';
import { PaymentDialog } from '../../components/payment-dialog/payment-dialog';

@Component({
  selector: 'app-group-detail',
  imports: [CurrencyPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatTabsModule, MatChipsModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetailPage implements OnInit {
  private groupId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    protected auth: AuthService,
    protected store: GroupStore,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.groupId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.groupId) this.store.loadGroupDetail(this.groupId);
  }

  getSharePerPerson(expense: Expense): number {
    return expense.amount / expense.splitBetween.length;
  }

  hasOpenBalances(): boolean {
    return this.store.balances().some(b => b.balance > 0.01 || b.balance < -0.01);
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.auth.currentUserId();
  }

  showPayButton(balance: Balance): boolean {
    return balance.balance < -0.01 && !this.isCurrentUser(balance.user.id);
  }

  openPaymentDialog(balance: Balance): void {
    const ref = this.dialog.open(PaymentDialog, {
      width: '400px',
      data: {
        fromUserName: balance.user.name,
        fromUserId: balance.user.id,
        totalOwed: Math.round(-balance.balance * 100) / 100,
      },
    });
    ref.afterClosed().subscribe(amount => {
      if (amount && this.groupId) {
        this.api.createPayment(this.groupId, {
          fromUser: balance.user.id,
          toUser: this.auth.currentUserId()!,
          amount,
        }).subscribe(() => this.store.loadGroupDetail(this.groupId));
      }
    });
  }

  openAddExpense(): void {
    const group = this.store.currentGroup();
    if (!group) return;
    const ref = this.dialog.open(AddExpenseDialog, {
      width: '450px',
      data: { group, categories: this.store.categories() },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.store.addExpense(this.groupId, result);
    });
  }

  openEditExpense(expense: Expense): void {
    const group = this.store.currentGroup();
    if (!group) return;
    const ref = this.dialog.open(AddExpenseDialog, {
      width: '450px',
      data: { group, categories: this.store.categories(), expense },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.store.editExpense(expense.id, this.groupId, result);
    });
  }

  openAddMember(): void {
    const group = this.store.currentGroup();
    if (!group) return;
    const ref = this.dialog.open(AddMemberDialog, {
      width: '400px',
      data: { group },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.store.loadGroupDetail(this.groupId);
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}

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
import { AuthService } from '../../services/auth.service';
import { GroupStore } from '../../services/group.store';
import { Expense } from '../../models/api.models';
import { AddExpenseDialog } from '../../components/add-expense-dialog/add-expense-dialog';
import { AddMemberDialog } from '../../components/add-member-dialog/add-member-dialog';

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

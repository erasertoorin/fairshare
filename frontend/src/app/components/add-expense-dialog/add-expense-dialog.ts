import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { GroupDetail, ExpenseCategory, Expense } from '../../models/api.models';

export interface ExpenseDialogData {
  group: GroupDetail;
  categories: ExpenseCategory[];
  expense?: Expense; // if set, we're editing
}

@Component({
  selector: 'app-add-expense-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './add-expense-dialog.html',
  styleUrl: './add-expense-dialog.scss',
})
export class AddExpenseDialog {
  description: string;
  amount: number | null;
  paidBy: string;
  categoryId: string;
  splitSelection: Record<string, boolean> = {};
  isEditMode: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData,
    private dialogRef: MatDialogRef<AddExpenseDialog>,
    private auth: AuthService,
  ) {
    this.isEditMode = !!data.expense;
    const e = data.expense;
    this.description = e?.description ?? '';
    this.amount = e?.amount ?? null;
    this.paidBy = e?.paidBy ?? this.auth.currentUserId() ?? '';
    this.categoryId = e?.categoryId ?? 'cat1';

    for (const m of data.group.memberDetails) {
      this.splitSelection[m.userId] = e ? e.splitBetween.includes(m.userId) : true;
    }
  }

  get paidByName(): string {
    return this.data.group.memberDetails.find(m => m.userId === this.paidBy)?.user.name ?? '';
  }

  get splitBetween(): string[] {
    return Object.entries(this.splitSelection)
      .filter(([, selected]) => selected)
      .map(([userId]) => userId);
  }

  get isValid(): boolean {
    return !!this.description && !!this.amount && this.amount > 0 && this.splitBetween.length > 0;
  }

  save(): void {
    if (!this.isValid || !this.amount) return;
    this.dialogRef.close({
      description: this.description,
      amount: this.amount,
      paidBy: this.paidBy,
      splitBetween: this.splitBetween,
      categoryId: this.categoryId,
    });
  }
}

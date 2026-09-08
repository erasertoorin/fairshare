import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { GroupDetail, ExpenseCategory } from '../../models/api.models';

export interface AddExpenseDialogData {
  group: GroupDetail;
  categories: ExpenseCategory[];
}

@Component({
  selector: 'app-add-expense-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './add-expense-dialog.html',
  styleUrl: './add-expense-dialog.scss',
})
export class AddExpenseDialog {
  description = '';
  amount: number | null = null;
  paidBy: string;
  categoryId = 'cat1';
  splitSelection: Record<string, boolean> = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddExpenseDialogData,
    private dialogRef: MatDialogRef<AddExpenseDialog>,
    private api: ApiService,
    private auth: AuthService,
  ) {
    this.paidBy = this.auth.currentUserId() ?? '';
    for (const m of data.group.memberDetails) {
      this.splitSelection[m.userId] = true;
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
    this.api.createExpense(this.data.group.id, {
      description: this.description,
      amount: this.amount,
      paidBy: this.paidBy,
      splitBetween: this.splitBetween,
      categoryId: this.categoryId,
    }).subscribe(() => this.dialogRef.close(true));
  }
}

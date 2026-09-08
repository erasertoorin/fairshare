import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Group, GroupDetail, Expense, ExpenseCategory, Payment, Balance } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const userId = this.auth.currentUserId();
    return userId ? new HttpHeaders({ 'X-User-Id': userId }) : new HttpHeaders();
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  createUser(data: { name: string; email: string }): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, data);
  }

  // Groups
  getGroups(userId?: string): Observable<Group[]> {
    const url = userId ? `${this.baseUrl}/groups?userId=${userId}` : `${this.baseUrl}/groups`;
    return this.http.get<Group[]>(url);
  }

  getGroup(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.baseUrl}/groups/${id}`);
  }

  createGroup(data: { name: string; description: string; members: { userId: string; role: number }[] }): Observable<Group> {
    return this.http.post<Group>(`${this.baseUrl}/groups`, data, { headers: this.headers });
  }

  // Categories
  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.baseUrl}/categories`);
  }

  // Expenses
  getExpenses(groupId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/groups/${groupId}/expenses`);
  }

  createExpense(groupId: string, data: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    categoryId?: string;
    date?: string;
  }): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/groups/${groupId}/expenses`, data, { headers: this.headers });
  }

  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`, { headers: this.headers });
  }

  // Payments
  createPayment(groupId: string, data: { fromUser: string; toUser: string; amount: number }): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/groups/${groupId}/payments`, data, { headers: this.headers });
  }

  // Balances
  getBalances(groupId: string): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.baseUrl}/groups/${groupId}/balances`);
  }
}

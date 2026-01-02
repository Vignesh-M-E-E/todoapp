import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Todo {
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  date: string;
  month?: number;
  year?: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private collectionName = 'todos';

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  /** 🔹 Get current user ID */
  private getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /** 🔹 Extract month & year from date string */
  private extractMonthYear(dateString: string): { month: number; year: number } {
    const date = new Date(dateString);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };
  }

  /** 🔹 CREATE TODO */
  createTodo(todo: { title: string; description: string; status: string; priority: string; date: string }): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) return throwError(() => ({ message: 'User not authenticated' }));

    const { month, year } = this.extractMonthYear(todo.date);

    const todoData: Todo = {
      ...todo,
      month,
      year,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const todosCollection = collection(this.firestore, this.collectionName);

    return from(addDoc(todosCollection, todoData)).pipe(
      map((docRef) => ({
        message: 'Todo created successfully',
        todo: { id: docRef.id, ...todoData }
      })),
      catchError((error) => {
        console.error('Error creating todo:', error);
        return throwError(() => ({ message: 'Failed to create todo. hello Please try again.' }));
      })
    );
  }

  /** 🔹 GET ALL TODOS for current user */
  getAllTodos(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) return throwError(() => ({ message: 'User not authenticated' }));

    const todosCollection = collection(this.firestore, this.collectionName);
    const q = query(
      todosCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const todos: Todo[] = [];
        querySnapshot.forEach((docSnap) => {
          todos.push({ id: docSnap.id, ...docSnap.data() as Todo });
        });
        return { todos };
      }),
      catchError((error) => {
        console.error('Error loading todos:', error);
        return throwError(() => ({ message: 'Failed to load todos. Please try again.' }));
      })
    );
  }

  /** 🔹 UPDATE TODO */
  updateTodo(id: string, todo: { title: string; description: string; status: string; priority: string; date: string }): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) return throwError(() => ({ message: 'User not authenticated' }));

    const { month, year } = this.extractMonthYear(todo.date);
    const todoDocRef = doc(this.firestore, this.collectionName, id);

    const updateData = {
      ...todo,
      month,
      year,
      updatedAt: new Date().toISOString()
    };

    return from(updateDoc(todoDocRef, updateData)).pipe(
      map(() => ({
        message: 'Todo updated successfully',
        todo: { id, ...updateData, userId }
      })),
      catchError((error) => {
        console.error('Error updating todo:', error);
        return throwError(() => ({ message: 'Failed to update todo. Please try again.' }));
      })
    );
  }

  /** 🔹 DELETE TODO */
  deleteTodo(id: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) return throwError(() => ({ message: 'User not authenticated' }));

    const todoDocRef = doc(this.firestore, this.collectionName, id);

    return from(deleteDoc(todoDocRef)).pipe(
      map(() => ({ message: 'Todo deleted successfully' })),
      catchError((error) => {
        console.error('Error deleting todo:', error);
        return throwError(() => ({ message: 'Failed to delete todo. Please try again.' }));
      })
    );
  }

  /** 🔹 FILTER TODOS by Month & Year */
  getTodosByMonth(month: number, year: number): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) return throwError(() => ({ message: 'User not authenticated' }));

    if (!month || month < 1 || month > 12) {
      return throwError(() => ({ message: 'Invalid month (1–12 required)' }));
    }
    if (!year || year < 2000 || year > 2100) {
      return throwError(() => ({ message: 'Invalid year (2000–2100 required)' }));
    }

    const todosCollection = collection(this.firestore, this.collectionName);
    const q = query(
      todosCollection,
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year),
      orderBy('date', 'desc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const todos: Todo[] = [];
        querySnapshot.forEach((docSnap) => {
          todos.push({ id: docSnap.id, ...docSnap.data() as Todo });
        });
        return { todos };
      }),
      catchError((error) => {
        console.error('Error filtering todos:', error);
        if (error.code === 'failed-precondition') {
          return throwError(() => ({
            message: 'Firestore index required — check Firestore console link.'
          }));
        }
        return throwError(() => ({ message: 'Failed to filter todos. Please try again.' }));
      })
    );
  }
}

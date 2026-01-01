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

  /**
   * Get the current user ID
   */
  private getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Create a new todo
   */
  createTodo(todo: { title: string; description: string; status: string; priority: string; date: string }): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    const todoData: Todo = {
      ...todo,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const todosCollection = collection(this.firestore, this.collectionName);
    
    return from(addDoc(todosCollection, todoData)).pipe(
      map((docRef) => {
        return {
          message: 'Todo created successfully',
          todo: {
            id: docRef.id,
            ...todoData
          }
        };
      }),
      catchError((error) => {
        return throwError(() => ({ message: 'Failed to create todo. Please try again.' }));
      })
    );
  }

  /**
   * Get all todos for the current user
   */
  getAllTodos(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    const todosCollection = collection(this.firestore, this.collectionName);
    const q = query(
      todosCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const todos: Todo[] = [];
        querySnapshot.forEach((doc) => {
          todos.push({
            id: doc.id,
            ...doc.data() as Omit<Todo, 'id'>
          });
        });
        return { todos };
      }),
      catchError((error) => {
        return throwError(() => ({ message: 'Failed to load todos. Please try again.' }));
      })
    );
  }

  /**
   * Get a single todo by ID
   */
  getTodoById(id: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    const todoDocRef = doc(this.firestore, this.collectionName, id);
    
    return from(getDoc(todoDocRef)).pipe(
      map((docSnapshot) => {
        if (!docSnapshot.exists()) {
          throw new Error('Todo not found');
        }
        
        const todoData = docSnapshot.data() as Todo;
        
        // Verify that the todo belongs to the current user
        if (todoData.userId !== userId) {
          throw new Error('Unauthorized access');
        }
        
        return {
          todo: {
            id: docSnapshot.id,
            ...todoData
          }
        };
      }),
      catchError((error) => {
        return throwError(() => ({ message: error.message || 'Failed to load todo. Please try again.' }));
      })
    );
  }

  /**
   * Update a todo
   */
  updateTodo(id: string, todo: { title: string; description: string; status: string; priority: string; date: string }): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    const todoDocRef = doc(this.firestore, this.collectionName, id);
    
    const updateData = {
      ...todo,
      updatedAt: new Date().toISOString()
    };

    return from(updateDoc(todoDocRef, updateData)).pipe(
      map(() => {
        return {
          message: 'Todo updated successfully',
          todo: {
            id,
            ...updateData,
            userId
          }
        };
      }),
      catchError((error) => {
        return throwError(() => ({ message: 'Failed to update todo. Please try again.' }));
      })
    );
  }

  /**
   * Delete a todo
   */
  deleteTodo(id: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    const todoDocRef = doc(this.firestore, this.collectionName, id);
    
    return from(deleteDoc(todoDocRef)).pipe(
      map(() => {
        return { message: 'Todo deleted successfully' };
      }),
      catchError((error) => {
        return throwError(() => ({ message: 'Failed to delete todo. Please try again.' }));
      })
    );
  }

  /**
   * Get todos filtered by month and year
   */
  getTodosByMonth(month: number, year: number): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return throwError(() => ({ message: 'User not authenticated' }));
    }

    // Create date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const todosCollection = collection(this.firestore, this.collectionName);
    const q = query(
      todosCollection,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const todos: Todo[] = [];
        querySnapshot.forEach((doc) => {
          const todoData = doc.data() as Todo;
          const todoDate = todoData.date;
          
          // Filter by month and year
          if (todoDate >= startDate && todoDate <= endDate) {
            todos.push({
              id: doc.id,
              ...todoData
            });
          }
        });
        return { todos };
      }),
      catchError((error) => {
        return throwError(() => ({ message: 'Failed to filter todos. Please try again.' }));
      })
    );
  }
}

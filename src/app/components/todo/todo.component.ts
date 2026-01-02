import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { AuthService } from '../../services/auth.service';

interface Todo {
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  date: string;
}

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  title = '';
  description = '';
  status = 'Pending';
  priority = 'Medium';
  date = '';

  todos: Todo[] = [];
  editingTodo: Todo | null = null;
  isEditMode = false;
  loading = false;

  filterMonth = new Date().getMonth() + 1;
  filterYear = new Date().getFullYear();
  isFilterActive = false;

  errorMessage = '';
  successMessage = '';

  statusOptions = ['Pending', 'In Progress', 'Completed'];
  priorityOptions = ['Low', 'Medium', 'High'];
  monthOptions = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' },
    { value: 3, name: 'March' }, { value: 4, name: 'April' },
    { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' },
    { value: 9, name: 'September' }, { value: 10, name: 'October' },
    { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.date = new Date().toISOString().split('T')[0];
    this.loadTodos();
  }

  /** 🟢 LOAD ALL TODOS */
  loadTodos() {
    this.loading = true;
    this.errorMessage = '';
    this.todoService.getAllTodos().subscribe({
      next: (res) => {
        this.todos = res.todos || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Failed to load todos.';
      }
    });
  }

  /** 🟢 CREATE TODO */
  createTodo() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title || !this.description) {
      this.errorMessage = 'Title and description required';
      return;
    }

    const todo = { title: this.title, description: this.description, status: this.status, priority: this.priority, date: this.date };

    this.todoService.createTodo(todo).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.resetForm();
        this.loadTodos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to create todo.';
      }
    });
  }

  /** 🟢 EDIT TODO */
  editTodo(todo: Todo) {
    this.editingTodo = { ...todo };
    this.isEditMode = true;
    this.title = todo.title;
    this.description = todo.description;
    this.status = todo.status;
    this.priority = todo.priority;
    this.date = todo.date;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** 🟢 UPDATE TODO */
  updateTodo() {
    if (!this.editingTodo?.id) {
      this.errorMessage = 'Invalid todo ID';
      return;
    }

    const updatedTodo = { title: this.title, description: this.description, status: this.status, priority: this.priority, date: this.date };

    this.todoService.updateTodo(this.editingTodo.id, updatedTodo).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.cancelEdit();
        this.loadTodos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to update todo.';
      }
    });
  }

  /** 🟢 DELETE TODO */
  deleteTodo(id: string | undefined) {
    if (!id) return;
    if (confirm('Delete this todo?')) {
      this.todoService.deleteTodo(id).subscribe({
        next: (res) => {
          this.successMessage = res.message;
          this.loadTodos();
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Delete failed.';
        }
      });
    }
  }

  /** 🟢 FILTER TODOS BY MONTH */
  filterTodosByMonth() {
    this.loading = true;
    this.errorMessage = '';
    this.isFilterActive = true;

    this.todoService.getTodosByMonth(this.filterMonth, this.filterYear).subscribe({
      next: (res) => {
        this.todos = res.todos || [];
        this.loading = false;
        if (this.todos.length === 0) {
          this.errorMessage = `No todos found for ${this.monthOptions.find(m => m.value === this.filterMonth)?.name} ${this.filterYear}`;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Failed to filter todos.';
      }
    });
  }

  clearFilter() {
    this.isFilterActive = false;
    this.filterMonth = new Date().getMonth() + 1;
    this.filterYear = new Date().getFullYear();
    this.loadTodos();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingTodo = null;
    this.resetForm();
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.status = 'Pending';
    this.priority = 'Medium';
    this.date = new Date().toISOString().split('T')[0];
  }

  getPriorityClass(priority: string): string {
    return priority.toLowerCase();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}

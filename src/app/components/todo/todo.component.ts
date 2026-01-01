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
  title: string = '';
  description: string = '';
  status: string = 'Pending';
  priority: string = 'Medium';
  date: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  
  todos: Todo[] = [];
  editingTodo: Todo | null = null;
  isEditMode: boolean = false;
  loading: boolean = false;
  
  // Month filter properties
  filterMonth: number = new Date().getMonth() + 1; // Current month (1-12)
  filterYear: number = new Date().getFullYear(); // Current year
  isFilterActive: boolean = false;

  statusOptions = ['Pending', 'In Progress', 'Completed'];
  priorityOptions = ['Low', 'Medium', 'High'];
  monthOptions = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.date = new Date().toISOString().split('T')[0]; // Set default date to today
    this.loadTodos();
  }

  loadTodos() {
    this.loading = true;
    this.errorMessage = '';
    
    this.todoService.getAllTodos().subscribe({
      next: (response) => {
        this.todos = response.todos || [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load todos. Please try again.';
        this.loading = false;
        console.error('Error loading todos:', error);
      }
    });
  }

  createTodo() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title || !this.description) {
      this.errorMessage = 'Title and description are required';
      return;
    }

    const todo = {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      date: this.date
    };

    this.todoService.createTodo(todo).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Todo created successfully!';
        this.resetForm();
        this.loadTodos();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to create todo. Please try again.';
      }
    });
  }

  editTodo(todo: Todo) {
    this.editingTodo = { ...todo };
    this.isEditMode = true;
    this.title = todo.title;
    this.description = todo.description;
    this.status = todo.status;
    this.priority = todo.priority;
    this.date = todo.date || new Date().toISOString().split('T')[0];
    this.scrollToForm();
  }

  updateTodo() {
    if (!this.editingTodo) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title || !this.description) {
      this.errorMessage = 'Title and description are required';
      return;
    }

    const updatedTodo = {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      date: this.date
    };

    if (!this.editingTodo.id) {
      this.errorMessage = 'Invalid todo ID';
      return;
    }

    this.todoService.updateTodo(this.editingTodo.id, updatedTodo).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Todo updated successfully!';
        this.cancelEdit();
        this.loadTodos();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to update todo. Please try again.';
      }
    });
  }

  deleteTodo(id: string | undefined) {
    if (!id) {
      this.errorMessage = 'Invalid todo ID';
      return;
    }

    if (confirm('Are you sure you want to delete this todo?')) {
      this.todoService.deleteTodo(id).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Todo deleted successfully!';
          this.loadTodos();
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to delete todo. Please try again.';
        }
      });
    }
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
  
  filterTodosByMonth() {
    this.loading = true;
    this.errorMessage = '';
    this.isFilterActive = true;
    
    this.todoService.getTodosByMonth(this.filterMonth, this.filterYear).subscribe({
      next: (response) => {
        this.todos = response.todos || [];
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to filter todos. Please try again.';
        this.loading = false;
        console.error('Error filtering todos:', error);
      }
    });
  }
  
  clearFilter() {
    this.isFilterActive = false;
    this.filterMonth = new Date().getMonth() + 1;
    this.filterYear = new Date().getFullYear();
    this.loadTodos();
  }

  scrollToForm() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPriorityClass(priority: string): string {
    switch(priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  getStatusClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'in progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Navigate anyway even if logout fails
        this.router.navigate(['/login']);
      }
    });
  }
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Todo } from './types/todo';

export default function Home() {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [newTodo, setNewTodo] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const completedCount = todos.filter((todo) => todo.completed).length;
	const pendingCount = todos.length - completedCount;

	useEffect(() => {
		fetchTodos();
	}, []);

	const fetchTodos = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch('/api/todos');
			if (!response.ok) throw new Error('Failed to fetch todos');
			const data = await response.json();

			if (!data.success) throw new Error(data.error);
			setTodos(data.todos || []);
		} catch (err) {
			console.error(err);
			setError('Failed to load todos. Please try again.');
			toast.error('Error', {
				description: 'Failed to load todos. Please try again.'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const addTodo = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (!newTodo.trim()) return;

		setIsSubmitting(true);

		const optimisticTodo: Todo = {
			id: Date.now().toString(),
			title: newTodo,
			completed: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		setTodos((todos) => [...todos, optimisticTodo]);
		setNewTodo('');

		try {
			const response = await fetch('/api/todos', {
				method: 'POST',
				body: JSON.stringify({ title: newTodo, completed: false }),
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();
			if (!response.ok || !data.success)
				throw new Error(data.error || 'Failed to add todo');

			// Replace optimistic todo with server response
			setTodos((todos) =>
				todos.map((todo) => (todo.id === optimisticTodo.id ? data.todo : todo))
			);

			toast.success('Success', {
				description: 'Todo added successfully'
			});
		} catch (err) {
			console.error(err);
			setTodos((todos) =>
				todos.filter((todo) => todo.id !== optimisticTodo.id)
			);
			setNewTodo(optimisticTodo.title);
			toast.error('Error', {
				description: 'Failed to add todo. Please try again.'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleTodo = async (id: string, completed: boolean) => {
		setTodos((todos) =>
			todos.map((todo) =>
				todo.id === id ? { ...todo, completed: !completed } : todo
			)
		);

		try {
			const response = await fetch(`/api/todos/${id}`, {
				method: 'PUT',
				body: JSON.stringify({ completed: !completed }),
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();
			if (!response.ok || !data.success)
				throw new Error(data.error || 'Failed to update todo');

			// Update with full server response
			setTodos((todos) =>
				todos.map((todo) => (todo.id === id ? data.todo : todo))
			);
		} catch (err) {
			console.error(err);
			setTodos((prev) =>
				prev.map((todo) =>
					todo.id === id ? { ...todo, completed: completed } : todo
				)
			);
			toast.error('Error', {
				description: 'Failed to update todo. Please try again.'
			});
		}
	};

	const deleteTodo = async (id: string) => {
		const deletedTodo = todos.find((todo) => todo.id === id);
		setTodos((todos) => todos.filter((todo) => todo.id !== id));

		try {
			const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
			const data = await response.json();
			if (!response.ok || !data.success)
				throw new Error(data.error || 'Failed to delete todo');

			toast.success('Success', {
				description: 'Todo deleted successfully'
			});
		} catch (err) {
			console.error(err);
			if (deletedTodo) {
				setTodos((todos) =>
					[...todos, deletedTodo].sort((a, b) => a.id.localeCompare(b.id))
				);
			}
			toast.error('Error', {
				description: 'Failed to delete todo. Please try again.'
			});
		}
	};

	return (
		<div className='container mx-auto p-4 max-w-2xl'>
			<Card className='shadow-lg rounded-none'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold flex items-center gap-2'>
						Todo List
					</CardTitle>
					<CardDescription>Manage your tasks efficiently</CardDescription>

					{todos.length > 0 && (
						<div className='flex gap-2 mt-2'>
							<Badge variant='outline' className='bg-primary/10 rounded-xs'>
								Total: {todos.length}
							</Badge>
							<Badge
								variant='outline'
								className='bg-green-500/10 text-green-600 rounded-xs'
							>
								Completed: {completedCount}
							</Badge>
							<Badge
								variant='outline'
								className='bg-orange-500/10 text-orange-600 rounded-xs'
							>
								Pending: {pendingCount}
							</Badge>
						</div>
					)}
				</CardHeader>

				<CardContent>
					<form onSubmit={addTodo} className='flex gap-2 mb-6'>
						<Input
							value={newTodo}
							onChange={(e) => setNewTodo(e.target.value)}
							placeholder='Add new todo'
							disabled={isSubmitting}
							className='shadow-sm rounded-[1px] focus-visible:border-0 focus-visible:ring-primary focus-visible:ring-2'
						/>
						<Button
							type='submit'
							disabled={isSubmitting || !newTodo.trim()}
							className='gap-1 bg-primary rounded-xs hover:bg-primary/80 cursor-pointer'
						>
							{isSubmitting ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								'Add'
							)}
						</Button>
					</form>

					{error && (
						<div className='bg-destructive/10 text-destructive p-3 rounded-xs mb-4 flex items-center gap-2'>
							<AlertCircle className='h-4 w-4' />
							{error}
						</div>
					)}

					{isLoading ? (
						<div className='flex justify-center py-8'>
							<Loader2 className='h-8 w-8 animate-spin text-primary' />
						</div>
					) : todos.length === 0 ? (
						<div className='text-center py-8 text-muted-foreground'>
							<p>No todos yet. Add your first task above!</p>
						</div>
					) : (
						<AnimatePresence>
							<div className='space-y-3'>
								{todos.map((todo) => (
									<motion.div
										key={todo.id}
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.2 }}
										className='flex items-center gap-3 p-3 rounded-xs border bg-card hover:bg-accent/5 transition-colors'
									>
										<Checkbox
											checked={todo.completed}
											onCheckedChange={() =>
												toggleTodo(todo.id, todo.completed)
											}
											className='data-[state=checked]:bg-green-600 rounded-xs'
										/>
										<span
											className={`flex-1 ${
												todo.completed
													? 'line-through text-muted-foreground'
													: ''
											}`}
										>
											{todo.title}
										</span>

										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant='ghost'
													size='icon'
													className='text-destructive hover:cursor-pointer hover:text-destructive hover:bg-destructive/10 hover:rounded-xs'
												>
													<Trash2 className='h-4 w-4' />
													<span className='sr-only'>Delete</span>
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent className='rounded-xs'>
												<AlertDialogHeader>
													<AlertDialogTitle>Are you sure?</AlertDialogTitle>
													<AlertDialogDescription>
														This will permanently delete this todo.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel className='rounded-xs cursor-pointer'>
														Cancel
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => deleteTodo(todo.id)}
														className='bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/80 rounded-xs text-white'
													>
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</motion.div>
								))}
							</div>
						</AnimatePresence>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

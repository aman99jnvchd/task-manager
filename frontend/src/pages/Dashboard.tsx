// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getUsersList, getAdminsList, getTasksList, createTask, updateTask, deleteTask } from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import type { Task } from '../types/task';
import type { User } from '../types/user';
import Filters from '../components/Filters';
import TaskDetailsModal from '../components/TaskDetailsModal';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Dashboard: React.FC = () => {
    const { token, currentUserId, isAdmin } = useAuth();
    const [error, setError] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAssignedAt, setShowAssignedAt] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('low');
    const [assignedTo, setAssignedTo] = useState('');
    /* Get today's date in YYYY-MM-DD */
    const today = new Date().toISOString().split('T')[0];
    const [loaderTaskId, setLoaderTaskId] = useState<number | null>(null);

    const [filters, setFilters] = useState({
        priority: '',
        is_completed: '',
        assigned_to: '',
        assigned_by: '',
        due_date: '',
        approval_status: '',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        /* Fetch tasks initially */
        const fetchTasks = async () => {
            try {
                const queryParams = buildQueryParams();
                const pageParam = `page=${currentPage}`;
                const finalQuery = [queryParams, pageParam].filter(Boolean).join('&');

                const data = await getTasksList(finalQuery);
                
                setTasks(data.results);
                setTotalPages(Math.ceil(data.count / 30));
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            }
        };
        fetchTasks();
    }, [currentPage, filters]);
    
    useEffect(() => {
        /* Fetch users list */
        const fetchUsers = async () => {
            try {
                const data = await getUsersList();
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            }
        };

        isAdmin && fetchUsers();
    }, [isAdmin]);

    useEffect(() => {
        /* Fetch admins list */
        getAdminsList()
        .then(setAdmins)
        .catch(() => console.error('Failed to fetch admins'));

        if (currentUserId === null || token === null) return;
        /* When WebSocket connection is established */
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/tasks/?token=${token}`);
        ws.onopen = () => console.log('WebSocket connected');

        /* On receiving message via WebSocket */
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { event: type, task } = data;

            console.log("🔁 WebSocket message received:", data);

            setTasks((prev) => {
                const isAssignee = task.assigned_to === currentUserId;
                const exists = prev.some((t) => t.id === task.id);

                /* Deleting task from Admin & relevant Assignee */
                if (type === 'deleted') {
                    return prev.filter((t) => t.id !== task.id);
                }

                /* Add, Update, Remove - if Admin or Assignee */
                if (isAdmin || isAssignee) {
                    if (exists) {
                        /* Updating task */
                        return prev.map((t) => (t.id === task.id ? task : t));
                    } else {
                        /* Adding task: when new task created or existing task assigend to current user */
                        return [task, ...prev];
                    }
                } else {
                    if (exists) {
                        /* Removing task: when a task no longer assigned to current user */
                        return prev.filter((t) => t.id !== task.id);
                    }
                }
                return prev;
            });
        };

        /* On WebSocket error */
        ws.onerror = () => console.error('WebSocket error');
        /* On WebSocket disconnection (any reason) */
        ws.onclose = () => console.log('WebSocket disconnected');
        /* Close WebSocket on unmount */
        return () => ws.close();
    }, [token, currentUserId, isAdmin]);

    /* Adding new task */
    const addTask = async () => {
        setError('');

        if (!newTitle?.trim() || !newDescription?.trim() || !dueDate || !priority || Number(assignedTo) == 0) {
            setError("All fields are required");
            return;
        }
        if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            setError('Due date format must be DD-MM-YYYY');
            return;
        }

        try {
            await createTask({
                title: newTitle.trim(),
                description: newDescription.trim(),
                due_date: dueDate,
                priority,
                // assigned_to: assignedTo,
                assigned_to: assignedTo === '' ? null : Number(assignedTo),
                assigned_by: currentUserId,
                assigned_at: new Date().toISOString()
            });
            
            setNewTitle('');
            setNewDescription('');
            setDueDate('');
            setPriority('low');
            setAssignedTo('');
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to add task:', err);
        }
    };

    /* Closing the add new task form */
    const closeAddTaskForm = () => {
        setError('');
        setNewTitle('');
        setNewDescription('');
        setDueDate('');
        setPriority('low');
        setAssignedTo('');
        setIsModalOpen(false);
    }

    /* Mark task as Completed or In Progress */
    const toggleTaskStatus = async (id: number, currentStatus: boolean) => {
        setLoaderTaskId(id);

        try {
            await updateTask(id, { is_completed: !currentStatus });
        } catch (err) {
            console.error('Failed to update task status:', err);
        } finally {
            setLoaderTaskId(null);
        }
    };

    /* Send request to admin to approve task completion */
    const sendApprovalRequest = async (id: number) => {
        setLoaderTaskId(id);

        try {
            await updateTask(id, { is_approval_requested: true });
        } catch (err) {
            console.error('Failed to send approval request:', err);
        } finally {
            setLoaderTaskId(null);
        }
    };

    /* Approve or Reject task completion */
    const approveTaskStatus = async (id: number, isApproved: boolean) => {
        let taskStatus;

        if (isApproved) {
            taskStatus = {
                is_completed: isApproved,
                is_approval_requested: true,
                approved_by: currentUserId,
                approved_at: new Date().toISOString()
            }
        } else {
            taskStatus = {
                is_completed: isApproved,
                is_approval_requested: false
            }
        }

        setLoaderTaskId(id);

        try {
            await updateTask(id, taskStatus);
        } catch (err) {
            console.error('Failed to approve/reject task completion:', err);
        } finally {
            setLoaderTaskId(null);
        }
    };

    /* Task deletion */
    const removeTask = async (id: number) => {
        try {
            await deleteTask(id);
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    /* Task updation in view/update Modal */
    const handleUpdateTask = async (id: number, updatedData: Partial<Task>): Promise<boolean> => {
        try {
            const updatedTask = await updateTask(id, updatedData);
            /* Update task in Modal - view & update task */
            setSelectedTask(updatedTask);
            /* Update tasks */
            setTasks(prev =>
                prev.map(task => (task.id === updatedTask.id ? updatedTask : task))
            );
            /* Check if need to show assigned_at */
            showAssigned(updatedTask.assigned_at, updatedTask.created_at);
            /* returning true if everything worked */
            return true
        } catch (err) {
            console.error('Failed to update task details:', err);
            /* returning false if something went wrong */
            return false
        }
    };

    /* If assigned_at and created_at are different */
    const showAssigned = (assigned_at: string, created_at: string) => {
        const assignedAt = new Date(assigned_at);
        const createdAt = new Date(created_at);
        /* Convert both to YYYY-MM-DD strings */
        const assignedDate = assignedAt.toISOString().split('T')[0];
        const createdDate = createdAt.toISOString().split('T')[0];

        setShowAssignedAt(assignedDate !== createdDate);
    };

    /* Task deletion & Close view/update Modal */
    const handleDeleteTask = async (id: number) => {
        await removeTask(id);
        setSelectedTask(null);
    };

    /* Open view/update Modal */
    const handleTaskClick = (task: Task) => {
        /* Check if need to show assigned_at */
        showAssigned(task.assigned_at, task.created_at);
        setSelectedTask(task);
    };

    /* Close view/update Modal */
    const handleCloseModal = () => {
        setSelectedTask(null);
    };

    /* Apply filters */
    const handleFilterChange = (updatedFilters: typeof filters) => {
        setFilters(updatedFilters);
        setCurrentPage(1);
    };

    /* Remove all applied filters */
    const clearFilters = () => {
        setFilters({
            priority: '',
            is_completed: '',
            assigned_to: '',
            assigned_by: '',
            due_date: '',
            approval_status: '',
        });
        setCurrentPage(1);
    };

    /* Build query string for filters */
    const buildQueryParams = () => {
        const query = Object.entries(filters)
            .filter(([_, value]) => value !== '')
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        return query;
    };

    return (
        <div className="bg-[#1a1a1a] text-white min-h-screen">
            <Sidebar />

            <main className="p-6 md:pl-[16rem] transition-all duration-300">
                {/* Header for Mobile */}
                <div className="md:hidden flex flex-col text-center items-end mb-6">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    {isAdmin && (
                        <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded">
                            Add Task
                        </button>
                    )}
                </div>

                {/* Header for Desktop */}
                <div className="hidden md:flex flex-row justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    {isAdmin && (
                        <button onClick={() => setIsModalOpen(true)} className="mt-0 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded">
                            Add Task
                        </button>
                    )}
                </div>

                {/* Filters */}
                {(tasks.length > 0 || (tasks.length === 0 && Object.values(filters).some(val => val !== ''))) && (
                    <Filters
                        isAdmin={isAdmin}
                        filters={filters}
                        users={users}
                        admins={admins}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                    />
                )}

                {/* Tasks listing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.length === 0 ? (
                        Object.values(filters).some(val => val !== '') ? (
                            <div className="text-gray-400 col-span-full mt-10 text-center tracking-[2px]">
                                No tasks match the applied filters
                            </div>
                        ) : (
                            <div className="text-gray-400 col-span-full mt-10 text-center tracking-[2px]">
                                No tasks assigned yet
                            </div>
                        )
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} onClick={() => handleTaskClick(task)} className="task-card group relative bg-[#222] overflow-hidden shadow-md rounded">
                                <div className="select-none task-card-content relative z-[1] p-5">
                                    {/* Task title */}
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-semibold text-gray-100 truncate max-w-[70%]">{task.title}</h3>
                                    </div>
                                    {/* Task description */}
                                    <p className="task-description overflow-hidden h-[60px] text-gray-400 mt-3 text-sm">{task.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {/* Task priority */}
                                        <span className={`badge ${task.priority} rounded`}>{task.priority}</span>
                                        {/* Task status */}
                                        {isAdmin ? (
                                            task.is_completed ? (
                                                task.is_approval_requested ? (
                                                    <span className="badge completed rounded">Completed</span>
                                                ) : (
                                                    <span className="badge progress rounded">In Progress</span>
                                                )
                                            ) : (
                                                <span className="badge progress rounded">In Progress</span>
                                            )
                                        ) : (
                                            <span className={`badge ${task.is_completed ? 'completed' : 'progress'} rounded`}> {task.is_completed ? 'Completed' : 'In Progress'}</span>
                                        )}
                                        {/* Due date */}
                                        <span className="badge2 rounded">
                                            <i className="far fa-calendar mr-1"></i> Due: {task.due_date}
                                        </span>
                                        {/* Assignee */}
                                        {isAdmin && (
                                            <span className="badge2 rounded" data-assignee-id={`${task.assigned_to}`}>
                                                <i className="far fa-user mr-1"></i>
                                                {users.find((user) => user.id === task.assigned_to)?.username || 'Unknown'}
                                            </span>
                                        )}
                                        {/* Assigned by */}
                                        <span className="badge2 rounded" data-assignee-id={`${task.assigned_to}`}>
                                            {/* <i className="far fa-user mr-1"></i> */}
                                            By: {admins.find((admin) => admin.id === task.assigned_by)?.username || 'Unknown'}
                                            {task.assigned_by === currentUserId ? " (You)" : ""}
                                        </span>
                                        {/* Task approval not requested */}
                                        {!isAdmin && task.is_completed && !task.is_approval_requested && (
                                            <span className={`badge medium rounded`}>Approval Not Sent</span>
                                        )}
                                    </div>
                                    <div className="mt-4 text-[15px] text-white flex flex-row items-center justify-between gap-2">
                                        {isAdmin ? (
                                            <>
                                                {/* When task is approved */}
                                                {task.is_completed && task.is_approval_requested && Number(task.approved_by) > 0 && task.approved_at ? (
                                                    <span className="bg-green-600 w-full flex justify-center items-center tracking-[1px] h-[44px] rounded">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    task.is_completed && task.is_approval_requested && (
                                                        <>
                                                            {/* Button to approve task completion */}
                                                            <button
                                                                disabled={loaderTaskId === task.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    approveTaskStatus(task.id, task.is_completed);
                                                                }}
                                                                className={`button-smooth w-full flex justify-center items-center tracking-[1px] h-[44px] rounded
                                                                    ${loaderTaskId === task.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                                                `}
                                                            >
                                                                {loaderTaskId === task.id ? (
                                                                    <div className="loader"/>
                                                                ) : (
                                                                    'Approve'
                                                                )}
                                                            </button>
                                                            {/* Button to reject task completion */}
                                                            <button
                                                                disabled={loaderTaskId === task.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    approveTaskStatus(task.id, !task.is_completed);
                                                                }}
                                                                className={`button-smooth w-full flex justify-center items-center tracking-[1px] h-[44px] rounded
                                                                    ${loaderTaskId === task.id ? 'cursor-not-allowed' : 'button-delete button-scale'}
                                                                `}
                                                            >
                                                                {loaderTaskId === task.id ? (
                                                                    <div className="loader"/>
                                                                ) : (
                                                                    'Reject'
                                                                )}
                                                            </button>
                                                        </>
                                                    )
                                                )}
                                                {/* Button to delete task */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        Swal.fire({
                                                            title: 'Are you sure?',
                                                            text: "This task will be permanently deleted",
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Delete',
                                                            confirmButtonColor: '#dc2626',
                                                            reverseButtons: true
                                                        }).then((result) => {
                                                            if (result.isConfirmed) {
                                                                removeTask(task.id);
                                                                Swal.fire({
                                                                    title: "Deleted!",
                                                                    text: "Task has been deleted",
                                                                    icon: "success"
                                                                });
                                                            }
                                                        });
                                                    }}
                                                    className={`button-smooth button-scale button-delete h-[44px] flex justify-center items-center rounded
                                                        ${task.is_completed && task.is_approval_requested ? 'w-[44px]' : 'w-full'}
                                                    `}
                                                >
                                                    <i className="far fa-trash-alt -mb-[1px] -ml-[1px]"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* When task is approved */}
                                                {task.is_completed && task.is_approval_requested && Number(task.approved_by) > 0 && task.approved_at ? (
                                                    <span className="bg-green-600 w-full flex justify-center items-center tracking-[1px] h-[44px] rounded">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    task.is_completed ? (
                                                        task.is_approval_requested ? (
                                                            /* Task is marked as completed and send for approval */
                                                            <span className="bg-[#1a1a1a] w-full flex justify-center items-center tracking-[1px] h-[44px] rounded">
                                                                Waiting for approval
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {/* Button to mark task as In Progress */}
                                                                <button
                                                                    disabled={loaderTaskId === task.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleTaskStatus(task.id, task.is_completed);
                                                                    }}
                                                                    className={`button-smooth w-full flex justify-center items-center tracking-[1px] h-[44px] rounded
                                                                        ${loaderTaskId === task.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                                                    `}
                                                                >
                                                                    {loaderTaskId === task.id ? (
                                                                        <div className="loader"/>
                                                                    ) : (
                                                                        'Mark as In Progress'
                                                                    )}
                                                                </button>
                                                                {/* Button to send task for approval */}
                                                                <div className="relative flex items-center group">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            sendApprovalRequest(task.id);
                                                                        }}
                                                                        className="button-smooth button-gradient button-scale w-[44px] h-[44px] flex justify-center items-center rounded peer"
                                                                    >
                                                                        <i className="far fa-paper-plane -mb-[1px] -ml-[1px]"></i>
                                                                    </button>
                                                                    <div className="tooltip-box">
                                                                        Send for approval
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )
                                                    ) : (
                                                        /* Button to mark task as Completed */
                                                        <button
                                                            disabled={loaderTaskId === task.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleTaskStatus(task.id, task.is_completed);
                                                            }}
                                                            className={`button-smooth w-full flex justify-center items-center tracking-[1px] h-[44px] rounded
                                                                ${loaderTaskId === task.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                                            `}
                                                        >
                                                            {loaderTaskId === task.id ? (
                                                                <div className="loader"/>
                                                            ) : (
                                                                'Mark as Completed'
                                                            )}
                                                        </button>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-[#222] rounded disabled:opacity-60"
                        >
                            Prev
                        </button>

                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 rounded ${
                                    currentPage === i + 1 ? "bg-indigo-700 text-white" : "bg-[#222]"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-[#222] rounded disabled:opacity-60"
                        >
                            Next
                        </button>
                    </div>
                )}
                
                {/* Modal - add new task */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="space-y-4 bg-[#191919] p-6 rounded shadow-lg w-full max-w-md">
                            <h2 className="text-xl font-bold">Add New Task</h2>
                            {/* Task title */}
                            <input
                                type="text"
                                name="new_title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Task title"
                                className="input-field w-full px-3 py-2 border rounded appearance-none"
                            />
                            {/* Task description */}
                            <textarea
                                name="new_description"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Optional description"
                                className="input-field w-full px-3 py-2 border rounded appearance-none"
                                rows={3}
                            />
                            {/* Task due date */}
                            <input
                                type="date"
                                name="due_date"
                                value={dueDate}
                                min={today}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input-field w-full px-3 py-2 border rounded appearance-none"
                            />
                            {/* Task priority */}
                            <select
                                name="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                            >
                                <option value="low" >Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                            {/* Task assigned to */}
                            <select
                                name="assigned_to"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                            >
                                <option value="">Assign to</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                            {/* Form error */}
                            {error && (
                                <div className="mb-3">
                                    <label className="text-red-500 text-[15px]">{error}</label>
                                </div>
                            )}
                            {/* Cancel/Add task */}
                            <div className="flex justify-end gap-2">
                                <button onClick={closeAddTaskForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
                                    Cancel
                                </button>
                                <button onClick={addTask} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal - view & update task */}
                {selectedTask && (
                    <TaskDetailsModal
                        task={selectedTask}
                        is_admin={isAdmin}
                        current_user_id={currentUserId}
                        users={users}
                        admins={admins}
                        showAssignedDate={showAssignedAt}
                        onClose={handleCloseModal}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                    />
                )}
            </main>
        </div>
    );
};

export default Dashboard;

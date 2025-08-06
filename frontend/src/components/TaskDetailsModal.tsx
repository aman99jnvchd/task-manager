// src/components/TaskDetailsModal.tsx
import React, { useState } from 'react';
import type { Task } from '../types/task';
import type { User } from '../types/user';
import { formatDate } from '../utils/formatDate';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type Props = {
    task: Task;
    is_admin: boolean;
    current_user_id: number | null;
    users: User[];
    admins: User[];
    showAssignedDate: boolean;
    onClose: () => void;
    onUpdate: (id: number, updatedTask: Partial<Task>) => Promise<boolean>;
    onDelete: (id: number) => void;
};

const TaskDetailsModal: React.FC<Props> = ({
    task,
    is_admin,
    current_user_id,
    users,
    admins,
    showAssignedDate,
    onClose,
    onUpdate,
    onDelete
}) => {
    const isAdmin = is_admin;
    /* Get today's date in YYYY-MM-DD */
    const today = new Date().toISOString().split('T')[0];
    const [error, setError] = useState('');
    const [loaderTaskId, setLoaderTaskId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Task>({ ...task });

    /* Update task details during editing */
    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setEditedTask(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    /* Toggle task status */
    const validateTaskStatus = async (id: number) => {
        const toUpdate = { is_completed: !editedTask.is_completed }

        setLoaderTaskId(id);

        try {
            const isWorked = await onUpdate(id, toUpdate);
            if (isWorked) {
                const updated = { ...editedTask, ...toUpdate };
                setEditedTask(updated);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Try again later',
                    text: 'Failed to update task status'
                });
            }
        } catch (err) {
            console.error('Failed to update task status:', err);
        } finally {
            setLoaderTaskId(null);
        }
    };

    /* Send request to admin to approve task completion */
    const sendApprovalRequest = async (id: number) => {
        const toUpdate = { is_approval_requested: true }
        
        setLoaderTaskId(id);

        try {
            const isWorked = await onUpdate(id, toUpdate);
            if (isWorked) {
                const updated = { ...editedTask, ...toUpdate };
                setEditedTask(updated);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Try again later',
                    text: 'Failed to send approval request'
                });
            }
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
                approved_by: current_user_id,
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
            const isWorked = await onUpdate(id, taskStatus);
            if (isWorked) {
                const updated = { ...editedTask, ...taskStatus };
                setEditedTask(updated);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Try again later',
                    text: `Failed to ${isApproved ? 'approve' : 'reject'} task completion`
                });
            }
        } catch (err) {
            console.error('Failed to approve/reject task completion:', err);
        } finally {
            setLoaderTaskId(null);
        }
    };

    /* Save updated task details */
    const handleUpdate = async (id: number) => {
        setError('');

        if (
            !editedTask.title?.trim() ||
            !editedTask.description?.trim() ||
            !editedTask.due_date ||
            !editedTask.priority ||
            Number(editedTask.assigned_to) == 0
        ) {
            setError("All fields are required");
            return;
        }
        if (editedTask.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(editedTask.due_date)) {
            setError('Due date format must be DD-MM-YYYY');
            return;
        }

        /* Change assigned_by if assigned_to changed */
        if (editedTask.assigned_to != task.assigned_to && editedTask.assigned_by != current_user_id) {
            editedTask.assigned_by = current_user_id
        }

        const isWorked = await onUpdate(id, editedTask);
        if (isWorked) {
            setError('');
            setIsEditing(false);
        } else {
            setError('Unable to update task details, try again later');
            setIsEditing(true);
        }
    };

    /* Back to the view mode */
    const cancelEditing = () => {
        setIsEditing(false);
        setError('');
        setEditedTask({ ...task });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="w-[90%] max-h-screen bg-[#191919] text-white p-6 rounded shadow-lg relative animate-fade-in-up space-y-5">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-0 right-0 p-0">
                    <span className="button-smooth button-delete bg-[#191919] p-3 flex justify-center items-center">
                        <i className="fas fa-times"></i>
                    </span>
                </button>

                {/* Title */}
                {isEditing ? (
                    <input
                        type="text"
                        name="title"
                        value={editedTask.title}
                        onChange={handleFieldChange}
                        placeholder="Task title"
                        className="input-field w-full px-3 py-2 pr-6 border rounded appearance-none"
                    />
                ) : (
                    <h2 className="text-2xl font-semibold mt-0" style={{ marginTop: '5px' }}>{task.title}</h2>
                )}

                <div className="flex flex-wrap gap-3 text-base traking-[1px]">
                    {/* Task priority */}
                    {isEditing ? (
                        <select
                            name="priority"
                            value={editedTask.priority}
                            onChange={handleFieldChange}
                            className="custom-select w-max px-3 py-2 border rounded appearance-none pr-8"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    ) : (
                        <span className={`badge ${task.priority} rounded`}>{task.priority}</span>
                    )}
                    
                    {/* Task status */}
                    {!isEditing && (
                        isAdmin ? (
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
                        )
                    )}

                    {/* Due date */}
                    {isEditing ? (
                        <input
                            type="date"
                            name="due_date"
                            value={editedTask.due_date}
                            onChange={handleFieldChange}
                            min={today}
                            className="input-field w-max px-3 py-2 border rounded appearance-none"
                        />
                    ) : (
                        <span className="badge2 rounded">
                            {/* <i className="far fa-calendar mr-1"></i> Due: {formatDate(task.due_date)} */}
                            <i className="far fa-calendar mr-1"></i> Due: {formatDate(task.due_date || '')}
                        </span>
                    )}
                    
                    {/* Assignee */}
                    {isAdmin && (
                        isEditing ? (
                            <select
                                name="assigned_to"
                                // value={editedTask.assigned_to}
                                value={editedTask.assigned_to === null ? '' : editedTask.assigned_to}
                                onChange={handleFieldChange}
                                className="custom-select w-max px-3 py-2 border rounded appearance-none pr-8"
                            >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="badge2 rounded" data-assignee-id={`${task.assigned_to}`}>
                                <i className="far fa-user mr-1"></i>
                                {users.find((user) => user.id === task.assigned_to)?.username || 'Unknown'}
                            </span>
                        )
                    )}

                    {!isEditing && (
                        <>
                            {/* Assigned by */}
                            <span className="badge2 rounded">
                                By: {admins.find((admin) => admin.id === task.assigned_by)?.username || 'Unknown'}
                                {task.assigned_by === current_user_id ? " (You)" : ""}
                            </span>
                            {/* Assigned at */}
                            {showAssignedDate && (
                                <span className="badge2 rounded">
                                    Assigned: {formatDate(task.assigned_at)}
                                </span>
                            )}
                            {/* Created at */}
                            <span className="badge2 rounded">
                                Created: {formatDate(task.created_at)}
                            </span>
                            {/* Updated at */}
                            <span className="badge2 rounded">
                                Updated: {formatDate(task.updated_at)}
                            </span>
                        </>
                    )}

                    {/* Task approval not requested */}
                    {!isEditing && !isAdmin && task.is_completed && !task.is_approval_requested && (
                        <span className={`badge medium rounded`}>Approval Not Sent</span>
                    )}
                </div>

                {/* Description */}
                <div>
                    {isEditing ? (
                        <textarea
                            name="description"
                            value={editedTask.description}
                            onChange={handleFieldChange}
                            rows={8}
                            placeholder="Description"
                            className="input-field w-full px-3 py-2 border rounded appearance-none"
                        />
                    ) : (
                        <p className="text-gray-400 max-h-[23.4vh] overflow-y-auto whitespace-pre-wrap">{task.description}</p>
                    )}
                </div>
                
                {/* Update form error */}
                {error && (
                    <div className="ml-2" style={{ marginTop: '3px' }}>
                        <label className="text-red-500 text-[15px]">{error}</label>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    {!isEditing && (
                        /* Button to close modal */
                        <button onClick={onClose} className="hidden md:block px-4 py-2 bg-[#111] hover:bg-[#333] rounded">
                            Close
                        </button>
                    )}

                    {isAdmin ? ( !isEditing &&
                        <>
                            {editedTask.is_completed && editedTask.is_approval_requested && Number(editedTask.approved_by) > 0 && editedTask.approved_at ? (
                                /* When task is approved */
                                <span className="bg-green-600 w-auto px-5 select-none flex justify-center items-center tracking-[1px] rounded">
                                    Approved
                                </span>
                            ) : (
                                editedTask.is_completed && editedTask.is_approval_requested ? (
                                    <>
                                        {/* Button to approve task completion */}
                                        <button
                                            disabled={loaderTaskId === editedTask.id}
                                            onClick={() => approveTaskStatus(editedTask.id, editedTask.is_completed)}
                                            className={`button-smooth bg-[#111] w-auto flex justify-center items-center tracking-[1px] rounded
                                                ${loaderTaskId === editedTask.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                            `}
                                        >
                                            {loaderTaskId === editedTask.id ? (
                                                <div className="loader"/>
                                            ) : (
                                                'Approve'
                                            )}
                                        </button>
                                        {/* Button to reject task completion */}
                                        <button
                                            disabled={loaderTaskId === editedTask.id}
                                            onClick={() => approveTaskStatus(editedTask.id, !editedTask.is_completed)}
                                            className={`button-smooth bg-[#111] w-auto flex justify-center items-center tracking-[1px] rounded
                                                ${loaderTaskId === editedTask.id ? 'cursor-not-allowed' : 'button-delete button-scale'}
                                            `}
                                        >
                                            {loaderTaskId === editedTask.id ? (
                                                <div className="loader"/>
                                            ) : (
                                                'Reject'
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    /* Button to open edit form */
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-[#111] hover:bg-indigo-700 rounded"
                                    >
                                        Edit
                                    </button>
                                )
                            )}
                            {/* Button to delete task (Admins Only) */}
                            <button
                                onClick={() => {
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
                                            onDelete(editedTask.id);
                                            Swal.fire({
                                                title: "Deleted!",
                                                text: "Task has been deleted",
                                                icon: "success",
                                                // timer: 5000
                                            });
                                        }
                                    });
                                }}
                                className="button-smooth button-scale button-delete w-[44px] h-[44px] bg-[#111] flex justify-center items-center rounded"
                            >
                                <i className="far fa-trash-alt"></i>
                            </button>
                        </>
                    ) : (
                        <>
                            {editedTask.is_completed && editedTask.is_approval_requested && Number(editedTask.approved_by) > 0 && editedTask.approved_at ? (
                                /* When task is approved */
                                <span className="bg-green-600 px-5 select-none w-auto flex justify-center items-center tracking-[1px] rounded">
                                    Approved
                                </span>
                            ) : (
                                editedTask.is_completed ? (
                                    editedTask.is_approval_requested ? (
                                        /* Task is marked as completed and send for approval */
                                        <span className="bg-[#111] px-5 select-none w-auto flex justify-center items-center tracking-[1px] rounded">
                                            Waiting for approval
                                        </span>
                                    ) : (
                                        <>
                                            {/* Button to mark task as In Progress */}
                                            <button
                                                disabled={loaderTaskId === editedTask.id}
                                                onClick={() => validateTaskStatus(editedTask.id)}
                                                className={`button-smooth bg-[#111] w-auto flex justify-center items-center tracking-[1px] rounded
                                                    ${loaderTaskId === editedTask.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                                `}
                                            >
                                                {loaderTaskId === editedTask.id ? (
                                                    <div className="loader"/>
                                                ) : (
                                                    'Mark as In Progress'
                                                )}
                                            </button>
                                            {/* Button to send task for approval */}
                                            <div className="relative flex items-center group">
                                                <button
                                                    onClick={() => sendApprovalRequest(editedTask.id)}
                                                    className="button-smooth button-gradient button-scale bg-[#111] w-[44px] h-[44px] flex justify-center items-center rounded"
                                                >
                                                    <i className="far fa-paper-plane -mb-[1px] -ml-[1px]"></i>
                                                </button>
                                            </div>
                                        </>
                                    )
                                ) : (
                                    /* Button to mark task as Completed */
                                    <button
                                        disabled={loaderTaskId === editedTask.id}
                                        onClick={() => validateTaskStatus(editedTask.id)}
                                        className={`button-smooth bg-[#111] w-auto flex justify-center items-center tracking-[1px] rounded
                                            ${loaderTaskId === editedTask.id ? 'cursor-not-allowed' : 'button-gradient button-scale'}
                                        `}
                                    >
                                        {loaderTaskId === editedTask.id ? (
                                            <div className="loader"/>
                                        ) : (
                                            'Mark as Completed'
                                        )}
                                    </button>
                                )
                            )}
                        </>
                    )}

                    {isEditing && (
                        <>
                            {/* Button to cancel editing */}
                            <button
                                onClick={cancelEditing}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                            >
                                Cancel
                            </button>
                            {/* Button to update task details */}
                            <button
                                onClick={() => handleUpdate(editedTask.id)}
                                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded"
                            >
                                Update
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;

// src/components/Filters.tsx
import React from 'react';
import type { User } from '../types/user';

type FilterState = {
    priority: string;
    is_completed: string;
    assigned_to: string;
    assigned_by: string;
    due_date: string;
    approval_status: string;
};

type Props = {
    isAdmin: boolean;
    filters: FilterState;
    users: User[];
    admins: User[];
    onFilterChange: (updatedFilters: FilterState) => void;
    onClearFilters: () => void;
};

const Filters: React.FC<Props> = ({
    isAdmin,
    filters,
    users,
    admins,
    onFilterChange,
    onClearFilters
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-[#222] rounded text-[15px]">
            {/* Approval Status Filter */}
            <div>
                <select
                    name="approval_status"
                    value={filters.approval_status || ''}
                    onChange={handleChange}
                    className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                    style={{
                        borderColor: filters.approval_status !== '' ? '#8a8a8a' : undefined
                    }}
                >
                    <option value="">Select Approval Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Approval</option>
                    <option value="exclude_approved">Exclude Approved</option>
                </select>
            </div>

            {/* Priority Filter */}
            <div>
                <select
                    name="priority"
                    value={filters.priority}
                    onChange={handleChange}
                    className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                    style={{
                        borderColor: filters.priority !== '' ? '#8a8a8a' : undefined
                    }}
                >
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>

            {/* Task Status Filter */}
            <div>
                <select
                    name="is_completed"
                    value={filters.is_completed}
                    onChange={handleChange}
                    className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                    style={{
                        borderColor: filters.is_completed !== '' ? '#8a8a8a' : undefined
                    }}
                >
                    <option value="">Select Status</option>
                    <option value="false">In Progress</option>
                    <option value="true">Completed</option>
                </select>
            </div>

            {/* Assigned To Filter (Admin only) */}
            {isAdmin && (
                <div>
                    <select
                        name="assigned_to"
                        value={filters.assigned_to}
                        onChange={handleChange}
                        className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                        style={{
                            borderColor: filters.assigned_to !== '' ? '#8a8a8a' : undefined
                        }}
                    >
                        <option value="">Select Assigned User</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Assigned By Filter */}
            <div>
                <select
                    name="assigned_by"
                    value={filters.assigned_by}
                    onChange={handleChange}
                    className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                    style={{
                        borderColor: filters.assigned_by !== '' ? '#8a8a8a' : undefined
                    }}
                >
                    <option value="">Select Assigned By</option>
                    {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                            {admin.username}
                        </option>
                    ))}
                </select>
            </div>

            {/* Due Date Filter */}
            <div>
                <select
                    name="due_date"
                    value={filters.due_date}
                    onChange={handleChange}
                    className="custom-select w-full px-3 py-2 border rounded appearance-none pr-8"
                    style={{
                        borderColor: filters.due_date !== '' ? '#8a8a8a' : undefined
                    }}
                >
                    <option value="">Select Due Date</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                    <option value="future">Future</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>

            {/* Clear Filters */}
            <div>
                <button
                    onClick={onClearFilters}
                    className="button-smooth button-scale button-delete rounded"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default Filters;

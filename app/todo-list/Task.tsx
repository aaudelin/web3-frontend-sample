import { Contract } from "ethers";
import { useState } from "react";

type TaskProps = {
  id: number;
  content: string;
  status: number;
  createdAt: number;
  createdBy: string;
  contract?: Contract;
  listTasks: () => Promise<void>;
};

export default function Task({
  id,
  content,
  status,
  createdAt,
  createdBy,
  contract,
  listTasks,
}: TaskProps) {
  const [error, setError] = useState<string>();

  const updateStatus = async (newStatus: number) => {
    try {
      const tx = await contract?.update(id, content, newStatus);
      await tx?.wait();
      await listTasks();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      setError(error.message);
    }
  };

  const removeTask = async () => {
    try {
      const tx = await contract?.remove(id);
      await tx?.wait();
      await listTasks();
    } catch (error: any) {
      console.error("Failed to remove task:", error);
      setError(error.message);
    }
  };

  return (
    <div className="p-4 border border-gray-700 rounded-sm mt-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg">{content}</p>
          <div className="flex gap-2 text-sm text-gray-400">
            <p>Created by: {createdBy}</p>
            <p>Created at: {new Date(createdAt * 1000).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => updateStatus(Number(e.target.value))}
            className="bg-transparent border border-gray-700 rounded-sm px-2"
          >
            <option value={1}>Todo</option>
            <option value={2}>In Progress</option>
            <option value={3}>Done</option>
          </select>
          <button
            onClick={removeTask}
            className="text-red-500 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

"use client";

import { ethers, Signer, Contract, BrowserProvider } from "ethers";
import { useState } from "react";
import abi from "./abi.json";
import Task from "./Task";
import { MetaMaskInpageProvider } from "@metamask/providers";

type Task = {
  id: number;
  content: string;
  status: number;
  createdAt: number;
  createdBy: string;
};


declare global {
  interface Window{
    ethereum?:MetaMaskInpageProvider
  }
}

export default function TodoList() {
  const [wallet, setWallet] = useState<Signer | undefined>(undefined);
  const [address, setAddress] = useState<string>();
  const [contract, setContract] = useState<Contract>();
  const [provider, setProvider] = useState<BrowserProvider>();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>();
  const contractAddress = "0x0057377485E41CCa9D1818cEd2406bF8b3C8e759";

  const [newTask, setNewTask] = useState<string>("");

  const connectWithProvider = async () => {
    try {
      if (!window?.ethereum) {
        throw new Error("Please install MetaMask to use this app");
      }
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setProvider(provider);
      setWallet(signer);
      setContract(contract);
      setAddress(address);
      setBalance(balance);
    } catch (error: any) {
      console.error("Failed to connect to provider:", error);
      setError(error.reason);
    }
  };

  if (!wallet) {
    return (
      <div className="container mx-auto py-12">
        <button
          className="bg-red-100 text-black px-4 py-2 rounded-sm"
          onClick={connectWithProvider}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const createTask = async () => {
    try {
      const tx = await contract?.create(newTask, 1, {
        value: ethers.parseEther("0.01"),
      });
      await tx?.wait();
      setBalance((await provider?.getBalance(address ?? "")) ?? BigInt(0));
      setNewTask("");
    } catch (error: any) {
      console.error("Failed to create task:", error);
      setError(error.reason);
    }
  };

  const listTasks = async () => {
    try {
      const tasksProxy = (await contract?.getAll()) as Task[];
      const tasks = Array.from(tasksProxy || []).map((task: Task) => ({
        id: Number(task.id),
        content: task.content,
        status: Number(task.status),
        createdAt: Number(task.createdAt),
        createdBy: task.createdBy,
      }))
      .filter((task: Task) => task.id !== 0);
      setTasks(tasks);
      setBalance((await provider?.getBalance(address ?? "")) ?? BigInt(0));
      setError(undefined);
    } catch (error: any) {
      console.error("Failed to list tasks:", error);
      setError(error.reason);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <main>
        <h1 className="text-4xl font-bold">Todo List</h1>
        <p className="text-sm text-gray-200">
          {`Connected to account ${address}`}
        </p>
        <p className="text-sm text-gray-200">
          {`Balance: ${ethers.formatEther(balance)} eth`}
        </p>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Add a new task"
            className="w-full p-2 border border-gray-300 rounded-sm text-black"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button
            onClick={createTask}
            className="bg-red-100 text-black px-4 py-2 rounded-sm"
          >
            Add
          </button>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={listTasks}
            className="border border-red-400 text-white px-4 py-2 rounded-sm"
          >
            Refresh
          </button>
        </div>
        {tasks.map((task) => (
          <Task
            key={task.id}
            {...task}
            contract={contract}
            listTasks={listTasks}
          />
        ))}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </main>
    </div>
  );
}

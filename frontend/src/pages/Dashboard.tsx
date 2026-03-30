import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { MoM } from '../types';
import { Plus, Trash2, Edit2, LogOut, FileText, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

export default function Dashboard() {
    const [moms, setMoms] = useState<MoM[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMom, setEditingMom] = useState<MoM | null>(null);
    const [formData, setFormData] = useState({ title: '', meeting_date: '', content: '' });
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    useEffect(() => {
        fetchMoms();
    }, []);

    const fetchMoms = async () => {
        try {
            const response = await api.get('/mom/');
            setMoms(response.data);
        } catch (error) {
            console.error('Failed to fetch MoMs', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMom) {
                await api.put(`/mom/${editingMom.id}`, formData);
            } else {
                await api.post('/mom/', formData);
            }
            setShowModal(false);
            setEditingMom(null);
            setFormData({ title: '', meeting_date: '', content: '' });
            fetchMoms();
        } catch (error) {
            console.error('Failed to save MoM', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this MoM?')) {
            try {
                await api.delete(`/mom/${id}`);
                fetchMoms();
            } catch (error) {
                console.error('Failed to delete MoM', error);
            }
        }
    };

    const openEditModal = (mom: MoM) => {
        setEditingMom(mom);
        setFormData({
            title: mom.title,
            meeting_date: mom.meeting_date,
            content: mom.content
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingMom(null);
        setFormData({ title: '', meeting_date: new Date().toISOString().split('T')[0], content: '' });
        setShowModal(true);
    };

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                        {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Dashboard</h1>
                        <p className="text-sm text-muted">Welcome, {username}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary text-sm">
                    <LogOut size={16} /> Logout
                </button>
            </header>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-primary" /> My Minutes
                </h2>
                <button onClick={openCreateModal} className="btn btn-primary">
                    <Plus size={18} /> New MoM
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {moms.map((mom) => (
                    <div key={mom.id} className="card hover:border-primary/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold truncate pr-4">{mom.title}</h3>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(mom)}
                                    className="p-1.5 hover:bg-surface-hover rounded-md text-muted hover:text-primary transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(mom.id)}
                                    className="p-1.5 hover:bg-surface-hover rounded-md text-muted hover:text-error transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted mb-4">
                            <Calendar size={14} />
                            <span>{format(new Date(mom.meeting_date), 'MMMM d, yyyy')}</span>
                        </div>

                        <p className="text-muted line-clamp-3 text-sm mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {mom.content}
                        </p>
                    </div>
                ))}

                {moms.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted border border-dashed border-border rounded-xl">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No meeting minutes found. Create your first one!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="card w-full max-w-lg glass-panel shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingMom ? 'Edit MoM' : 'Create New MoM'}</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-muted hover:text-main text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-muted">Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Meeting Title"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-muted">Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.meeting_date}
                                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-muted">Content</label>
                                <textarea
                                    className="input"
                                    rows={6}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    placeholder="Meeting minutes content..."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMom ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

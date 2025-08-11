// src/pages/UserListPage.jsx
import React, { useState } from 'react';

export default function UserListPage() {
  const [users, setUsers] = useState([
    { id: 'u1', name: 'Aisha Kapoor', email: 'aisha.kapoor@example.com', role: 'Manager' },
    { id: 'u2', name: 'Ravi Sharma', email: 'ravi.sharma@example.com', role: 'Employee' },
    { id: 'u3', name: 'Nisha Patel', email: 'nisha.patel@example.com', role: 'Admin' },
    { id: 'u4', name: 'Karan Mehta', email: 'karan.mehta@example.com', role: 'Employee' }
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});

  const openDrawer = (user = {}) => {
    setCurrentUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const saveUser = (e) => {
    e.preventDefault();
    if (currentUser.id) {
      setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
    } else {
      setUsers([{ ...currentUser, id: 'u' + (Math.random()*1e7|0) }, ...users]);
    }
    closeDrawer();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-gray-500">Manage users — click edit to open the right-side drawer.</p>
        </div>
        <button className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600" onClick={() => openDrawer({})}>+ New User</button>
      </header>

      <section className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 text-teal-600 font-semibold rounded-lg flex items-center justify-center">
                      {user.name.split(' ').map(s => s[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">{user.email}</td>
                <td className="py-3 px-3">{user.role}</td>
                <td className="py-3 px-3 text-right">
                  <button className="border border-teal-500 text-teal-500 px-3 py-1 rounded-lg hover:bg-teal-50" onClick={() => openDrawer(user)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {drawerOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300" onClick={closeDrawer}></div>}

      <aside className={`fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 p-6 overflow-y-auto ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{currentUser.id ? 'Edit user' : 'Create user'}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={closeDrawer}>✕</button>
        </header>
      </aside>
    </div>
  );
}

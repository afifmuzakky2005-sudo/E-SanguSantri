const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagement.tsx', 'utf8');

// remove @
code = code.replace(
  '<td className="p-3.5 font-mono text-emerald-800 font-semibold">@{u.username}</td>',
  '<td className="p-3.5 font-mono text-emerald-800 font-semibold">{u.username}</td>'
);

// update username input to remove disabled={isEditing}
code = code.replace(
  `                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isEditing}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-gray-100 disabled:text-gray-400"`,
  `                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"`
);

// update submit logic to allow editing existing usernames properly
const submitOld = `    const cleanUsername = username.trim().toLowerCase();

    if (isEditing && editingUserId) {
      onEditUser({
        id: editingUserId,`;
const submitNew = `    const cleanUsername = username.trim().toLowerCase();

    if (isEditing && editingUserId) {
      if (users.some(u => u.username === cleanUsername && u.id !== editingUserId)) {
        alert(\`Username "\${cleanUsername}" sudah digunakan oleh staf lain!\`);
        return;
      }
      onEditUser({
        id: editingUserId,`;
code = code.replace(submitOld, submitNew);

fs.writeFileSync('src/components/UserManagement.tsx', code, 'utf8');
console.log('Success UserManagement');

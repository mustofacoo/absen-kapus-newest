
        // --- DATA INITIALIZATION & STATE ---
        const DB_KEY = 'absensi_app_v1';
        let state = {
            users: [], // {id, name, position, username}
            attendance: [], // {id, userId, date (YYYY-MM-DD), status, time, note}
            currentUser: null, // 'admin' or user object
            view: 'login' // login, admin-employees, admin-recap, emp-home, emp-history
        };

        // Seed Initial Data if Empty
async function initData() {
    try {
        console.log('Initializing app...');
        console.log('Current date (Jakarta):', getTodayDateJakarta());
        console.log('Current time (Jakarta):', getCurrentTimeJakarta());
        
        // Ambil data dari Supabase
        state.users = await fetchUsers();
        state.attendance = await fetchAttendance(); 
        
        // Jika tidak ada data, seed data awal
        if (state.users.length === 0) {
            await seedInitialData();
            state.users = await fetchUsers();
        }
    } catch (error) {
        console.error('Error initializing data:', error);
        showToast('Gagal memuat data', 'error');
    }
}

        function saveState() {
            localStorage.setItem(DB_KEY, JSON.stringify({
                users: state.users,
                attendance: state.attendance
            }));
        }

        // --- AUTH & NAVIGATION ---

        function switchLogin(type) {
            document.getElementById('form-employee').classList.toggle('hidden', type !== 'employee');
            document.getElementById('form-admin').classList.toggle('hidden', type !== 'admin');
            
            const btnEmp = document.getElementById('btn-login-employee');
            const btnAdm = document.getElementById('btn-login-admin');

            if (type === 'employee') {
                btnEmp.className = "flex-1 py-2 text-sm font-medium rounded shadow bg-white text-blue-600 transition-all";
                btnAdm.className = "flex-1 py-2 text-sm font-medium rounded text-slate-500 transition-all";
            } else {
                btnAdm.className = "flex-1 py-2 text-sm font-medium rounded shadow bg-white text-slate-900 transition-all";
                btnEmp.className = "flex-1 py-2 text-sm font-medium rounded text-slate-500 transition-all";
            }
        }

        function handleAdminLogin(e) {
            e.preventDefault();
            const u = document.getElementById('admin-username').value;
            const p = document.getElementById('admin-password').value;
            
            if (u === 'admin' && p === 'kapus78') {
                state.currentUser = 'admin';
                showDashboard();
                navTo('admin-employees');
            } else {
                showToast('Username atau password salah!', 'error');
            }
        }

        function handleEmployeeLogin(e) {
            e.preventDefault();
            const u = document.getElementById('emp-username').value;
            const user = state.users.find(x => x.username === u);

            if (user) {
                state.currentUser = user;
                showDashboard();
                navTo('emp-home');
            } else {
                showToast('Username tidak ditemukan!', 'error');
            }
        }

        function logout() {
            state.currentUser = null;
            document.getElementById('login-page').classList.remove('hidden');
            document.getElementById('dashboard-layout').classList.add('hidden');
            // Reset Forms
            document.getElementById('form-employee').reset();
            document.getElementById('form-admin').reset();
        }

        function showDashboard() {
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('dashboard-layout').classList.remove('hidden');
            
            // Toggle Menus
            const isAdmin = state.currentUser === 'admin';
            document.getElementById('admin-menu').classList.toggle('hidden', !isAdmin);
            document.getElementById('employee-menu').classList.toggle('hidden', isAdmin);
        }

function navTo(viewName) {
    state.view = viewName;
    renderContent();
    
    // UPDATE: Tutup sidebar otomatis jika di tampilan Mobile
    // Cek jika layar kurang dari 768px (ukuran md tailwind)
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
    }
}

        // --- RENDERING CONTENT ---

        function renderContent() {
            const container = document.getElementById('main-content');
            container.innerHTML = ''; // Clear

            if (state.view === 'admin-employees') renderAdminEmployees(container);
            else if (state.view === 'admin-recap') renderAdminRecap(container);
            else if (state.view === 'admin-personal') renderAdminPersonal(container);
            else if (state.view === 'emp-home') renderEmpHome(container);
            else if (state.view === 'emp-history') renderEmpHistory(container);
        }

        // --- ADMIN: EMPLOYEES CRUD ---

        function renderAdminEmployees(container) {
            let html = `
                <div class="flex justify-between items-center mb-6 fade-in">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">Data Pegawai</h2>
                        <p class="text-slate-500 text-sm">Kelola akses dan data pegawai</p>
                    </div>
                    <button onclick="openModal()" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                        <i class="fas fa-plus mr-2"></i> Tambah
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow overflow-hidden fade-in">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="p-4">Nama</th>
                                <th class="p-4">Posisi</th>
                                <th class="p-4">Username</th>
                                <th class="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm">
            `;

            if (state.users.length === 0) {
                html += `<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada data pegawai.</td></tr>`;
            } else {
                state.users.forEach(u => {
                    html += `
                        <tr class="hover:bg-slate-50">
                            <td class="p-4 font-medium text-slate-700">${u.name}</td>
                            <td class="p-4 text-slate-500">${u.position}</td>
                            <td class="p-4 text-slate-500"><span class="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">${u.username}</span></td>
                            <td class="p-4 text-right space-x-2">
                                <button onclick="openModal(${u.id})" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>
                                <button onclick="deleteEmployee(${u.id})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }

            html += `</tbody></table></div>

    <!-- Mobile Cards -->
    <div class="md:hidden divide-y divide-slate-100">
`;

if (state.users.length === 0) {
    html += `<div class="p-4 text-center text-slate-400">Belum ada data pegawai.</div>`;
} else {
    state.users.forEach(u => {
        html += `
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="font-semibold text-slate-800">${u.name}</div>
                        <div class="text-sm text-slate-500 mt-1">${u.position}</div>
                        <div class="mt-2">
                            <span class="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200 text-slate-600">${u.username}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 ml-2">
                        <button onclick="openModal(${u.id})" class="text-blue-600 hover:text-blue-800 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteEmployee(${u.id})" class="text-red-600 hover:text-red-800 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

html += `
    </div>
</div>
`;
            container.innerHTML = html;
        }

        // CRUD Logic
        function openModal(id = null) {
            const modal = document.getElementById('employee-modal');
            const title = document.getElementById('modal-title');
            
            document.getElementById('edit-id').value = id || '';
            document.getElementById('edit-name').value = '';
            document.getElementById('edit-position').value = '';
            document.getElementById('edit-username').value = '';

            if (id) {
                const u = state.users.find(x => x.id === id);
                title.innerText = 'Edit Pegawai';
                document.getElementById('edit-name').value = u.name;
                document.getElementById('edit-position').value = u.position;
                document.getElementById('edit-username').value = u.username;
            } else {
                title.innerText = 'Tambah Pegawai';
            }
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeModal() {
            document.getElementById('employee-modal').classList.add('hidden');
            document.getElementById('employee-modal').classList.remove('flex');
        }

        async function saveEmployee(e) {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const name = document.getElementById('edit-name').value;
            const position = document.getElementById('edit-position').value;
            const username = document.getElementById('edit-username').value;

            // Check duplicate username
            const duplicate = await checkUsernameExists(username, id || null);
            if (duplicate) {
                showToast('Username sudah digunakan!', 'error');
                return;
            }

            if (id) {
                // Update
                await updateUser(parseInt(id), { name, position, username });
                // Refresh data
                state.users = await fetchUsers();
            } else {
                // Create
                await createUser({ name, position, username });
                // Refresh data
                state.users = await fetchUsers();
            }
            
            closeModal();
            renderContent();
        }

        async function deleteEmployee(id) {
            if(confirm('Yakin ingin menghapus pegawai ini? Data absensi juga akan hilang.')) {
                await deleteUser(id);
                state.users = await fetchUsers();
                state.attendance = await fetchAttendance();
                renderContent();
            }
        }

        // --- ADMIN: RECAP ---

function renderAdminRecap(container) {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    const filterMonth = window.currentFilterMonth || currentMonth;
    window.currentFilterMonth = filterMonth;

    let html = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 fade-in">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Rekap Absensi Bulanan</h2>
                <p class="text-slate-500 text-sm">Lihat kehadiran semua pegawai</p>
            </div>
            <div class="flex items-center gap-2">
                <input type="month" id="recap-month" value="${filterMonth}" onchange="changeRecapMonth(this.value)" class="border rounded px-3 py-2 bg-white text-sm">
            </div>
        </div>
    `;

    const [year, month] = filterMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = Array.from({length: daysInMonth}, (_, i) => i + 1);

    html += `
    <div class="bg-white rounded-lg shadow overflow-hidden fade-in">
        <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse whitespace-nowrap">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                        <th class="p-3 sticky left-0 bg-slate-50 z-10 border-r">Pegawai</th>
                        <th class="p-3 text-center bg-green-50">H</th>
                        <th class="p-3 text-center bg-yellow-50">T</th>
                        <th class="p-3 text-center bg-blue-50">S/I/D</th>
                        <th class="p-3 text-center bg-red-50">A</th>
                        ${dates.map(d => `<th class="p-2 text-center w-10">${d}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-100">
`;

    state.users.forEach(u => {
        let hadir = 0, telat = 0, izin = 0, alpha = 0;
        let dailyCells = '';

        dates.forEach(d => {
            const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
            const todayStr = getTodayDateJakarta(); // ← PERBAIKAN: gunakan fungsi Jakarta
            const record = state.attendance.find(a => a.user_id === u.id && a.date === dateStr);
            
            let cell = '';
            
            if (record) {
                if (record.status === 'Hadir') {
                    cell = '<span class="text-green-600 font-bold" title="Hadir">●</span>';
                    hadir++;
                } else if (record.status === 'Terlambat') {
                    cell = '<span class="text-yellow-500 font-bold" title="Terlambat: '+record.time+'">T</span>';
                    telat++;
                } else {
                    cell = '<span class="text-blue-500 font-bold" title="'+record.status+': '+record.note+'">I</span>';
                    izin++;
                }
            } else {
                const dayOfWeek = new Date(dateStr).getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                
                if (dateStr < todayStr) {
                    if (isWeekend) {
                        cell = '<span class="text-slate-300" title="Libur (Sabtu/Minggu)">○</span>';
                    } else {
                        cell = '<span class="text-red-400 font-bold" title="Alpha">-</span>';
                        alpha++;
                    }
                } else {
                    cell = '<span class="text-slate-200">.</span>';
                }
            }
            dailyCells += `<td class="p-2 text-center border-l border-slate-100">${cell}</td>`;
        });

        html += `<tr class="hover:bg-slate-50">
            <td class="p-3 font-medium sticky left-0 bg-white border-r z-10">${u.name}</td>
            <td class="p-3 text-center font-bold text-green-700 bg-green-50">${hadir}</td>
            <td class="p-3 text-center font-bold text-yellow-700 bg-yellow-50">${telat}</td>
            <td class="p-3 text-center font-bold text-blue-700 bg-blue-50">${izin}</td>
            <td class="p-3 text-center font-bold text-red-700 bg-red-50">${alpha}</td>
            ${dailyCells}
        </tr>`;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="md:hidden divide-y divide-slate-200">
    `;

    state.users.forEach(u => {
        let hadir = 0, telat = 0, izin = 0, alpha = 0;

        dates.forEach(d => {
            const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
            const todayStr = getTodayDateJakarta(); // ← PERBAIKAN
            const record = state.attendance.find(a => a.user_id === u.id && a.date === dateStr);
            
            if (record) {
                if (record.status === 'Hadir') hadir++;
                else if (record.status === 'Terlambat') telat++;
                else izin++;
            } else {
                const dayOfWeek = new Date(dateStr).getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                if (dateStr < todayStr && !isWeekend) alpha++;
            }
        });

        html += `
            <div class="p-4">
                <div class="font-semibold text-slate-800 mb-3">${u.name}</div>
                <div class="grid grid-cols-4 gap-2 text-center text-xs">
                    <div class="bg-green-50 border border-green-200 rounded p-2">
                        <div class="text-green-600 font-bold text-lg">${hadir}</div>
                        <div class="text-green-700 mt-1">Hadir</div>
                    </div>
                    <div class="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <div class="text-yellow-600 font-bold text-lg">${telat}</div>
                        <div class="text-yellow-700 mt-1">Telat</div>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded p-2">
                        <div class="text-blue-600 font-bold text-lg">${izin}</div>
                        <div class="text-blue-700 mt-1">Izin</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 rounded p-2">
                        <div class="text-red-600 font-bold text-lg">${alpha}</div>
                        <div class="text-red-700 mt-1">Alpha</div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        </div>
    </div>
    `;

    container.innerHTML = html;
}

        function changeRecapMonth(val) {
            window.currentFilterMonth = val;
            renderAdminRecap(document.getElementById('main-content'));
        }
        // --- ADMIN: PERSONAL RECAP ---

// GANTI FUNGSI renderAdminPersonal yang ada dengan kode ini:

function renderAdminPersonal(container) {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    const filterMonth = window.currentPersonalMonth || currentMonth;
    const filterUserId = window.currentPersonalUser || (state.users.length > 0 ? state.users[0].id : null);
    
    window.currentPersonalMonth = filterMonth;
    window.currentPersonalUser = filterUserId;

    let html = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 fade-in">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Rekap Personal Detail</h2>
                <p class="text-slate-500 text-sm">Lihat detail absensi per pegawai</p>
            </div>
            <div class="flex items-center gap-2">
                <select id="personal-user" onchange="changePersonalUser(this.value)" class="border rounded px-3 py-2 bg-white text-sm">
                    ${state.users.map(u => `<option value="${u.id}" ${u.id == filterUserId ? 'selected' : ''}>${u.name}</option>`).join('')}
                </select>
                <input type="month" id="personal-month" value="${filterMonth}" onchange="changePersonalMonth(this.value)" class="border rounded px-3 py-2 bg-white text-sm">
            </div>
        </div>
    `;

    if (!filterUserId) {
        html += `<div class="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">Belum ada pegawai terdaftar.</div>`;
        container.innerHTML = html;
        return;
    }

    const selectedUser = state.users.find(u => u.id == filterUserId);
    const userAttendance = state.attendance.filter(a => a.user_id == filterUserId && a.date.startsWith(filterMonth)).sort((a, b) => a.date.localeCompare(b.date));

    let totalHadir = 0, totalTelat = 0, totalIzin = 0, totalAlpha = 0;
    const [year, month] = filterMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = getTodayDateJakarta();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Hitung statistik
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const record = userAttendance.find(a => a.date === dateStr);
        
        if (record) {
            if (record.status === 'Hadir') totalHadir++;
            else if (record.status === 'Terlambat') totalTelat++;
            else totalIzin++;
        } else if (dateStr < todayStr) {
            const dayOfWeek = new Date(dateStr).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            if (!isWeekend) {
                totalAlpha++;
            }
        }
    }

    // Info Pegawai & Statistik
    html += `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex items-center gap-4 mb-6 pb-6 border-b">
                <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                    <i class="fas fa-user text-blue-600 text-2xl"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-slate-800">${selectedUser.name}</h3>
                    <p class="text-slate-500">${selectedUser.position}</p>
                    <p class="text-xs text-slate-400 mt-1">Periode: ${formatMonthYear(filterMonth)}</p>
                </div>
            </div>

            <!-- Statistik Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                    <div class="text-green-600 text-xs font-semibold uppercase mb-1">Hadir</div>
                    <div class="text-3xl font-bold text-green-700">${totalHadir}</div>
                    <div class="text-green-500 text-sm mt-1">hari</div>
                </div>

                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                    <div class="text-yellow-600 text-xs font-semibold uppercase mb-1">Terlambat</div>
                    <div class="text-3xl font-bold text-yellow-700">${totalTelat}</div>
                    <div class="text-yellow-500 text-sm mt-1">hari</div>
                </div>

                <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div class="text-blue-600 text-xs font-semibold uppercase mb-1">Izin/Sakit</div>
                    <div class="text-3xl font-bold text-blue-700">${totalIzin}</div>
                    <div class="text-blue-500 text-sm mt-1">hari</div>
                </div>

                <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                    <div class="text-red-600 text-xs font-semibold uppercase mb-1">Alpha</div>
                    <div class="text-3xl font-bold text-red-700">${totalAlpha}</div>
                    <div class="text-red-500 text-sm mt-1">hari</div>
                </div>
            </div>
        </div>

        <!-- Detail Absensi -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4 bg-gradient-to-r from-slate-700 to-slate-800 border-b">
                <h3 class="font-bold text-white">Detail Kehadiran Harian</h3>
            </div>

            <!-- Desktop Table -->
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500">
                        <tr>
                            <th class="p-4">Tanggal</th>
                            <th class="p-4">Hari</th>
                            <th class="p-4">Status</th>
                            <th class="p-4">Jam</th>
                            <th class="p-4">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm">
    `;

    // Loop Detail Desktop
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const dayName = dayNames[dateObj.getDay()];
        const record = userAttendance.find(a => a.date === dateStr);

        let status = '-';
        let time = '-';
        let note = '-';
        let badgeColor = 'bg-slate-100 text-slate-600';
        let rowClass = '';

        if (record) {
            status = record.status;
            time = record.time;
            note = record.note;
            
            if (status === 'Hadir') {
                badgeColor = 'bg-green-100 text-green-800';
                rowClass = 'bg-green-50/30';
            } else if (status === 'Terlambat') {
                badgeColor = 'bg-yellow-100 text-yellow-800';
                rowClass = 'bg-yellow-50/30';
            } else {
                badgeColor = 'bg-blue-100 text-blue-800';
                rowClass = 'bg-blue-50/30';
            }
        } else if (dateStr < todayStr) {
            const isWeekend = (dayName === 'Sabtu' || dayName === 'Minggu');
            if (isWeekend) {
                status = 'Libur';
                note = 'Hari Libur';
                badgeColor = 'bg-slate-100 text-slate-500';
                rowClass = 'bg-slate-50';
            } else {
                status = 'Alpha';
                note = 'Tidak Hadir';
                badgeColor = 'bg-red-100 text-red-800';
                rowClass = 'bg-red-50/30';
            }
        } else {
            status = 'Belum Absen';
            badgeColor = 'bg-slate-100 text-slate-400';
        }

        const isToday = dateStr === todayStr;
        if (isToday) rowClass += ' ring-2 ring-blue-400';

        html += `
            <tr class="hover:bg-slate-50 ${rowClass}">
                <td class="p-4 font-medium">
                    ${formatDate(dateStr)}
                    ${isToday ? '<span class="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Hari Ini</span>' : ''}
                </td>
                <td class="p-4 ${dayName === 'Minggu' ? 'text-red-500 font-semibold' : dayName === 'Sabtu' ? 'text-blue-500 font-semibold' : 'text-slate-600'}">${dayName}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">${status}</span>
                </td>
                <td class="p-4 text-slate-600 font-mono">${time}</td>
                <td class="p-4 text-slate-500">${note}</td>
            </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </div>

            <!-- Mobile Cards -->
            <div class="md:hidden divide-y divide-slate-100">
    `;

    // Loop Detail Mobile
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const dayName = dayNames[dateObj.getDay()];
        const record = userAttendance.find(a => a.date === dateStr);

        let status = '-';
        let time = '-';
        let note = '-';
        let badgeColor = 'bg-slate-100 text-slate-600';
        let cardBg = '';

        if (record) {
            status = record.status;
            time = record.time;
            note = record.note;
            
            if (status === 'Hadir') {
                badgeColor = 'bg-green-100 text-green-800';
                cardBg = 'bg-green-50/50';
            } else if (status === 'Terlambat') {
                badgeColor = 'bg-yellow-100 text-yellow-800';
                cardBg = 'bg-yellow-50/50';
            } else {
                badgeColor = 'bg-blue-100 text-blue-800';
                cardBg = 'bg-blue-50/50';
            }
        } else if (dateStr < todayStr) {
            const isWeekend = (dayName === 'Sabtu' || dayName === 'Minggu');
            if (isWeekend) {
                status = 'Libur';
                note = 'Hari Libur';
                badgeColor = 'bg-slate-100 text-slate-500';
            } else {
                status = 'Alpha';
                note = 'Tidak Hadir';
                badgeColor = 'bg-red-100 text-red-800';
                cardBg = 'bg-red-50/50';
            }
        } else {
            status = 'Belum Absen';
            badgeColor = 'bg-slate-100 text-slate-400';
        }

        const isToday = dateStr === todayStr;

        html += `
            <div class="p-3 ${cardBg} ${isToday ? 'border-l-4 border-blue-500' : ''}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="text-sm font-semibold text-slate-800">
                            ${formatDate(dateStr)}
                            ${isToday ? '<span class="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Hari Ini</span>' : ''}
                        </div>
                        <div class="text-xs ${dayName === 'Minggu' ? 'text-red-500 font-semibold' : dayName === 'Sabtu' ? 'text-blue-500 font-semibold' : 'text-slate-500'}">${dayName}</div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${badgeColor}">${status}</span>
                </div>
                ${status !== 'Belum Absen' && status !== '-' ? `
                <div class="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-slate-200">
                    <div>
                        <span class="text-slate-500 block">Jam</span>
                        <span class="text-slate-800 font-mono">${time}</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block">Ket</span>
                        <span class="text-slate-800">${note}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Helper functions (jika belum ada di kode Anda)
function formatDate(dateStr) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function formatMonthYear(monthStr) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [year, month] = monthStr.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

        function changePersonalUser(userId) {
            window.currentPersonalUser = parseInt(userId);
            renderAdminPersonal(document.getElementById('main-content'));
        }

        function changePersonalMonth(month) {
            window.currentPersonalMonth = month;
            renderAdminPersonal(document.getElementById('main-content'));
        }

        // --- EMPLOYEE: HOME (ATTENDANCE FORM) ---

        function renderEmpHome(container) {
            const todayStr = getTodayDateJakarta(); // ← DIGANTI INI
            
            console.log('=== RENDER EMP HOME ===');
            console.log(' Today (Jakarta):', todayStr);
            console.log(' Current User:', state.currentUser);
            const existing = state.attendance.find(a => a.user_id === state.currentUser.id && a.date === todayStr);

            let html = `
                <div class="max-w-2xl mx-auto fade-in">
                    <div class="bg-white rounded-lg shadow-lg p-6 mb-6 border-t-4 border-blue-600">
                        <h2 class="text-2xl font-bold mb-1">Halo, ${state.currentUser.name}</h2>
                        <p class="text-slate-500 mb-6">${state.currentUser.position}</p>
            `;

            if (existing) {
                // Sudah Absen
                let statusColor = 'bg-green-100 text-green-800';
                if(existing.status === 'Terlambat') statusColor = 'bg-yellow-100 text-yellow-800';
                if(['Sakit', 'Izin', 'Dinas Luar'].includes(existing.status)) statusColor = 'bg-blue-100 text-blue-800';

                html += `
                        <div class="p-4 bg-slate-50 rounded-lg text-center border border-slate-200">
                            <i class="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                            <h3 class="text-lg font-semibold text-slate-800">Anda Sudah Absen Hari Ini</h3>
                            <div class="inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${statusColor}">
                                Status: ${existing.status}
                            </div>
                            ${existing.time ? `<p class="mt-2 text-slate-600">Jam: ${existing.time}</p>` : ''}
                            ${existing.note ? `<p class="mt-2 text-slate-600 italic">"${existing.note}"</p>` : ''}
                        </div>
                    </div>
                </div>`;
            } else {
                // Belum Absen Form
                html += `
                        <form onsubmit="submitAttendance(event)">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-700 mb-2">Status Kehadiran</label>
                                <select id="att-status" class="w-full border rounded px-3 py-2" onchange="toggleAttFields(this.value)">
                                    <option value="Hadir">Datang Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Dinas Luar">Tugas Luar / Dinas</option>
                                </select>
                            </div>

                            <div id="field-time" class="mb-4 hidden">
                                <label class="block text-sm font-medium text-slate-700 mb-2">Jam Kedatangan</label>
                                <input type="time" id="att-time" class="w-full border rounded px-3 py-2">
                            </div>

                            <div id="field-note" class="mb-4 hidden">
                                <label class="block text-sm font-medium text-slate-700 mb-2">Keterangan / Alasan</label>
                                <textarea id="att-note" class="w-full border rounded px-3 py-2" rows="2" placeholder="Tuliskan keterangan..."></textarea>
                            </div>

                            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition shadow-lg">
                                Kirim Absensi
                            </button>
                        </form>
                    </div>
                </div>`;
            }
            container.innerHTML = html;
        }

        function toggleAttFields(status) {
            const fieldTime = document.getElementById('field-time');
            const fieldNote = document.getElementById('field-note');
            
            fieldTime.classList.add('hidden');
            fieldNote.classList.add('hidden');

            if (status === 'Terlambat') {
                fieldTime.classList.remove('hidden');
            } else if (['Sakit', 'Izin', 'Dinas Luar'].includes(status)) {
                fieldNote.classList.remove('hidden');
            }
        }

async function submitAttendance(e) {
    e.preventDefault();
    const status = document.getElementById('att-status').value;
    const time = document.getElementById('att-time').value;
    const note = document.getElementById('att-note').value;
    const date = getTodayDateJakarta(); // ← PERBAIKAN
    
    console.log('=== SUBMIT ATTENDANCE ===');
    console.log('📅 Date (Jakarta):', date);
    console.log('👤 User ID:', state.currentUser.id);
    console.log('📝 Status:', status);

    // Validation
    if (status === 'Terlambat' && !time) {
        showToast('Mohon isi jam kedatangan', 'error');
        return;
    }
    if (['Sakit', 'Izin', 'Dinas Luar'].includes(status) && !note.trim()) {
        showToast('Mohon isi keterangan', 'error');
        return;
    }

    // Double-check: apakah sudah absen hari ini?
    const existingCheck = state.attendance.find(a => 
        a.user_id === state.currentUser.id && a.date === date
    );
    
    if (existingCheck) {
        showToast('Anda sudah absen hari ini!', 'error');
        console.log('⚠️ Already submitted today:', existingCheck);
        renderContent();
        return;
    }

    // Generate waktu otomatis jika tidak diisi
    let finalTime = time;
    if (!finalTime && (status === 'Hadir' || status === 'Terlambat')) {
        finalTime = getCurrentTimeJakarta(); // ← PERBAIKAN
    }

    // Save to Supabase
    const attendanceData = {
        userId: state.currentUser.id,
        date: date,
        status: status,
        time: finalTime || '-',
        note: note || '-'
    };

    await createAttendance(attendanceData);
    
    // Refresh data
    state.attendance = await fetchAttendance();
    renderContent();
}

        // --- EMPLOYEE: HISTORY ---

// --- EMPLOYEE: HISTORY ---

// --- EMPLOYEE: HISTORY ---

function renderEmpHistory(container) {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    
    // Filter bulan untuk pegawai
    const filterMonth = window.currentEmpHistoryMonth || currentMonth;
    window.currentEmpHistoryMonth = filterMonth;

    // Data absensi pegawai untuk bulan yang dipilih
    const myAtt = state.attendance
        .filter(a => a.user_id === state.currentUser.id && a.date.startsWith(filterMonth))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Hitung statistik bulanan
    let totalHadir = 0, totalTelat = 0, totalIzin = 0, totalAlpha = 0;
    const [year, month] = filterMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = getTodayDateJakarta();

    // TAMBAHKAN INI - Deklarasi dayNames
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const record = myAtt.find(a => a.date === dateStr);
        
        if (record) {
            if (record.status === 'Hadir') totalHadir++;
            else if (record.status === 'Terlambat') totalTelat++;
            else totalIzin++;
        } else if (dateStr < todayStr) {
            // Cek apakah weekend
            const dayOfWeek = new Date(dateStr).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            
            // Hanya hitung alpha jika bukan weekend
            if (!isWeekend) {
                totalAlpha++;
            }
        }
    }

    let html = `
        <div class="max-w-6xl mx-auto fade-in">
            <!-- Header dengan Filter Bulan -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Riwayat Absensi Saya</h2>
                    <p class="text-slate-500 text-sm">Lihat rekap dan detail absensi Anda</p>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-sm text-slate-600 font-medium">Bulan:</label>
                    <input type="month" id="emp-history-month" value="${filterMonth}" onchange="changeEmpHistoryMonth(this.value)" class="border rounded px-3 py-2 bg-white text-sm">
                </div>
            </div>

            <!-- Statistik Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-green-600 text-xs font-semibold uppercase mb-1">Hadir</div>
                            <div class="text-3xl font-bold text-green-700">${totalHadir}</div>
                        </div>
                        <div class="text-green-400 text-3xl">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-yellow-600 text-xs font-semibold uppercase mb-1">Terlambat</div>
                            <div class="text-3xl font-bold text-yellow-700">${totalTelat}</div>
                        </div>
                        <div class="text-yellow-400 text-3xl">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-blue-600 text-xs font-semibold uppercase mb-1">Izin/Sakit</div>
                            <div class="text-3xl font-bold text-blue-700">${totalIzin}</div>
                        </div>
                        <div class="text-blue-400 text-3xl">
                            <i class="fas fa-file-medical"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-red-600 text-xs font-semibold uppercase mb-1">Alpha</div>
                            <div class="text-3xl font-bold text-red-700">${totalAlpha}</div>
                        </div>
                        <div class="text-red-400 text-3xl">
                            <i class="fas fa-times-circle"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabel Detail -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b">
                    <h3 class="font-bold text-white text-lg">Detail Absensi Bulanan</h3>
                    <p class="text-blue-100 text-sm">Periode: ${formatMonthYear(filterMonth)}</p>
                </div>
                
                <!-- Desktop Table -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th class="p-4">Tanggal</th>
                                <th class="p-4">Hari</th>
                                <th class="p-4">Status</th>
                                <th class="p-4">Jam</th>
                                <th class="p-4">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-sm">
    `;

    // Loop untuk desktop
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const dayName = dayNames[dateObj.getDay()];
        const record = myAtt.find(a => a.date === dateStr);

        let status = '-';
        let time = '-';
        let note = '-';
        let badgeColor = 'bg-slate-100 text-slate-600';
        let rowClass = '';

        if (record) {
            status = record.status;
            time = record.time;
            note = record.note;
            
            if (status === 'Hadir') {
                badgeColor = 'bg-green-100 text-green-800';
                rowClass = 'bg-green-50/30';
            } else if (status === 'Terlambat') {
                badgeColor = 'bg-yellow-100 text-yellow-800';
                rowClass = 'bg-yellow-50/30';
            } else if (['Sakit', 'Izin', 'Dinas Luar'].includes(status)) {
                badgeColor = 'bg-blue-100 text-blue-800';
                rowClass = 'bg-blue-50/30';
            }
        } else if (dateStr < todayStr) {
            const isWeekend = (dayName === 'Sabtu' || dayName === 'Minggu');
            
            if (isWeekend) {
                status = 'Libur';
                note = 'Hari Libur';
                badgeColor = 'bg-slate-100 text-slate-500';
                rowClass = 'bg-slate-50';
            } else {
                status = 'Alpha';
                note = 'Tidak Hadir';
                badgeColor = 'bg-red-100 text-red-800';
                rowClass = 'bg-red-50/30';
            }
        } else {
            status = 'Belum Absen';
            badgeColor = 'bg-slate-100 text-slate-400';
        }

        const isToday = dateStr === todayStr;
        if (isToday) rowClass += ' ring-2 ring-blue-400';

        html += `
            <tr class="hover:bg-slate-50 ${rowClass}">
                <td class="p-4 text-slate-700 font-medium">
                    ${formatDate(dateStr)}
                    ${isToday ? '<span class="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Hari Ini</span>' : ''}
                </td>
                <td class="p-4 text-slate-600 ${dayName === 'Minggu' ? 'text-red-500 font-semibold' : dayName === 'Sabtu' ? 'text-blue-500 font-semibold' : ''}">${dayName}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">
                        ${status}
                    </span>
                </td>
                <td class="p-4 text-slate-600 font-mono">${time}</td>
                <td class="p-4 text-slate-500">${note}</td>
            </tr>
        `;
    }

    html += `
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Cards -->
                <div class="md:hidden divide-y divide-slate-100">
    `;

    // Loop untuk mobile
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${filterMonth}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(dateStr);
        const dayName = dayNames[dateObj.getDay()];
        const record = myAtt.find(a => a.date === dateStr);

        let status = '-';
        let time = '-';
        let note = '-';
        let badgeColor = 'bg-slate-100 text-slate-600';
        let cardBg = '';

        if (record) {
            status = record.status;
            time = record.time;
            note = record.note;
            
            if (status === 'Hadir') {
                badgeColor = 'bg-green-100 text-green-800';
                cardBg = 'bg-green-50/50';
            } else if (status === 'Terlambat') {
                badgeColor = 'bg-yellow-100 text-yellow-800';
                cardBg = 'bg-yellow-50/50';
            } else if (['Sakit', 'Izin', 'Dinas Luar'].includes(status)) {
                badgeColor = 'bg-blue-100 text-blue-800';
                cardBg = 'bg-blue-50/50';
            }
        } else if (dateStr < todayStr) {
            const isWeekend = (dayName === 'Sabtu' || dayName === 'Minggu');
            
            if (isWeekend) {
                status = 'Libur';
                note = 'Hari Libur';
                badgeColor = 'bg-slate-100 text-slate-500';
            } else {
                status = 'Alpha';
                note = 'Tidak Hadir';
                badgeColor = 'bg-red-100 text-red-800';
                cardBg = 'bg-red-50/50';
            }
        } else {
            status = 'Belum Absen';
            badgeColor = 'bg-slate-100 text-slate-400';
        }

        const isToday = dateStr === todayStr;

        html += `
            <div class="p-3 ${cardBg} ${isToday ? 'border-l-4 border-blue-500' : ''}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="text-sm font-semibold text-slate-800">
                            ${formatDate(dateStr)}
                            ${isToday ? '<span class="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Hari Ini</span>' : ''}
                        </div>
                        <div class="text-xs ${dayName === 'Minggu' ? 'text-red-500 font-semibold' : dayName === 'Sabtu' ? 'text-blue-500 font-semibold' : 'text-slate-500'}">${dayName}</div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-bold ${badgeColor}">${status}</span>
                </div>
                ${status !== 'Belum Absen' && status !== '-' ? `
                <div class="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-slate-200">
                    <div>
                        <span class="text-slate-500 block">Jam Masuk</span>
                        <span class="text-slate-800 font-semibold font-mono">${time}</span>
                    </div>
                    <div>
                        <span class="text-slate-500 block">Keterangan</span>
                        <span class="text-slate-800">${note}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    html += `
                </div>
            </div>

            <!-- Info Box -->
            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                        <div class="text-blue-800">
                            <p class="font-semibold mb-1">Informasi</p>
                            <p>Hari Senin-Jumat tanpa absen akan terhitung sebagai <b>Alpha</b>. Sabtu dan Minggu adalah hari libur dan tidak mempengaruhi rekap.</p>
                        </div>
                    </div>
                </div>
                
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
                        <div class="text-yellow-800">
                            <p class="font-semibold mb-1">Bismillah!</p>
                            <p>Semoga Allah berkahi hari kita, sehingga segala usaha kita dapat membawa manfaat bagi umat!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Fungsi helper untuk format tanggal
function formatDate(dateStr) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

// Fungsi helper untuk format bulan tahun
function formatMonthYear(monthStr) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [year, month] = monthStr.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

// Fungsi untuk mengubah bulan filter
function changeEmpHistoryMonth(month) {
    window.currentEmpHistoryMonth = month;
    renderEmpHistory(document.getElementById('main-content'));
}

        // --- UTILS ---

        function showToast(msg, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMsg = document.getElementById('toast-msg');
            toastMsg.innerText = msg;
            
            if (type === 'error') toast.classList.replace('bg-slate-800', 'bg-red-600');
            else toast.classList.replace('bg-red-600', 'bg-slate-800');

            toast.classList.remove('translate-x-full');
            setTimeout(() => {
                toast.classList.add('translate-x-full');
            }, 3000);
        }
        // --- MOBILE SIDEBAR LOGIC ---

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            // Cek apakah class 'hidden' ada
            if (sidebar.classList.contains('hidden')) {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('flex'); // Tampilkan sebagai flex
            } else {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            }
        }

        // Initialize App
        (async () => {
    await initData();
})();

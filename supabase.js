// ============================================
// SUPABASE CONNECTION & DATABASE OPERATIONS
// ============================================

// Konfigurasi Supabase
const SUPABASE_URL = 'https://zpyyozjxoklmftpunmlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXlvemp4b2tsbWZ0cHVubWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTUyNzQsImV4cCI6MjA3OTg3MTI3NH0.m4vQK00fIS3YoYMDy5isjDqAt2Ls05OeejFonSvom68';

// Inisialisasi Supabase Client (HANYA SATU KALI)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Supabase initialized');

// ============================================
// HELPER FUNCTIONS - TIMEZONE JAKARTA (UTC+7)
// ============================================

/**
 * Dapatkan tanggal hari ini dalam timezone Jakarta (YYYY-MM-DD)
 */
function getTodayDateJakarta() {
    try {
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const jakartaTime = new Date(utcTime + (7 * 3600000)); // UTC+7
        
        const year = jakartaTime.getFullYear();
        const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
        const day = String(jakartaTime.getDate()).padStart(2, '0');
        
        const result = `${year}-${month}-${day}`;
        console.log('📅 Jakarta Date:', result);
        return result;
    } catch (error) {
        console.error('❌ Error getting Jakarta date:', error);
        const now = new Date();
        return now.toISOString().split('T')[0];
    }
}

/**
 * Dapatkan waktu sekarang dalam format HH:MM (timezone Jakarta)
 */
function getCurrentTimeJakarta() {
    try {
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const jakartaTime = new Date(utcTime + (7 * 3600000)); // UTC+7
        
        const hours = String(jakartaTime.getHours()).padStart(2, '0');
        const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
        
        const result = `${hours}:${minutes}`;
        console.log('🕐 Jakarta Time:', result);
        return result;
    } catch (error) {
        console.error('❌ Error getting Jakarta time:', error);
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    }
}

// ============================================
// DATABASE OPERATIONS
// ============================================

// --- USERS ---

async function fetchUsers() {
    try {
        console.log('🔄 Fetching users...');
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        console.log('✅ Users loaded:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        showToast('Gagal memuat data pegawai: ' + error.message, 'error');
        return [];
    }
}

async function createUser(userData) {
    try {
        console.log('➕ Creating user:', userData.username);
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                name: userData.name,
                position: userData.position,
                username: userData.username
            }])
            .select();
        
        if (error) throw error;
        console.log('✅ User created');
        showToast('Pegawai berhasil ditambahkan');
        return data[0];
    } catch (error) {
        console.error('❌ Error creating user:', error);
        showToast('Gagal menambahkan pegawai: ' + error.message, 'error');
        return null;
    }
}

async function updateUser(id, userData) {
    try {
        console.log('📝 Updating user:', id);
        const { data, error } = await supabaseClient
            .from('users')
            .update({
                name: userData.name,
                position: userData.position,
                username: userData.username
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        console.log('✅ User updated');
        showToast('Data pegawai berhasil diperbarui');
        return data[0];
    } catch (error) {
        console.error('❌ Error updating user:', error);
        showToast('Gagal memperbarui: ' + error.message, 'error');
        return null;
    }
}

async function deleteUser(id) {
    try {
        console.log('🗑️ Deleting user:', id);
        
        // Hapus attendance dulu
        await supabaseClient.from('attendance').delete().eq('user_id', id);
        
        // Hapus user
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        
        if (error) throw error;
        console.log('✅ User deleted');
        showToast('Pegawai berhasil dihapus');
        return true;
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
        return false;
    }
}

async function checkUsernameExists(username, excludeId = null) {
    try {
        let query = supabaseClient.from('users').select('id').eq('username', username);
        if (excludeId) query = query.neq('id', excludeId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Error checking username:', error);
        return false;
    }
}

// --- ATTENDANCE ---

async function fetchAttendance() {
    try {
        console.log('🔄 Fetching attendance...');
        const { data, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        console.log('✅ Attendance loaded:', data?.length || 0);
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching attendance:', error);
        showToast('Gagal memuat absensi: ' + error.message, 'error');
        return [];
    }
}

async function fetchAttendanceByUser(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching user attendance:', error);
        return [];
    }
}

async function fetchAttendanceByMonth(yearMonth) {
    try {
        const { data, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .gte('date', `${yearMonth}-01`)
            .lte('date', `${yearMonth}-31`)
            .order('date', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching monthly attendance:', error);
        return [];
    }
}

async function checkTodayAttendance(userId) {
    try {
        const today = getTodayDateJakarta();
        console.log('🔍 Checking today attendance:', { userId, date: today });
        
        const { data, error } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        console.log('✅ Check result:', data ? 'Found' : 'Not found');
        return data || null;
    } catch (error) {
        console.error('❌ Error checking today:', error);
        return null;
    }
}

async function createAttendance(attendanceData) {
    try {
        console.log('💾 Creating attendance:', attendanceData);
        
        // Cek duplikasi
        const { data: existing } = await supabaseClient
            .from('attendance')
            .select('*')
            .eq('user_id', attendanceData.userId)
            .eq('date', attendanceData.date);
        
        if (existing && existing.length > 0) {
            console.log('⚠️ Already submitted');
            showToast('Anda sudah absen hari ini!', 'error');
            return null;
        }
        
        // Insert
        const { data, error } = await supabaseClient
            .from('attendance')
            .insert([{
                user_id: attendanceData.userId,
                date: attendanceData.date,
                status: attendanceData.status,
                time: attendanceData.time,
                note: attendanceData.note
            }])
            .select();
        
        if (error) throw error;
        console.log('✅ Attendance created');
        showToast('Absensi berhasil disimpan!');
        return data[0];
    } catch (error) {
        console.error('❌ Error creating attendance:', error);
        showToast('Gagal menyimpan: ' + error.message, 'error');
        return null;
    }
}

async function updateAttendance(id, attendanceData) {
    try {
        const { data, error } = await supabaseClient
            .from('attendance')
            .update({
                status: attendanceData.status,
                time: attendanceData.time,
                note: attendanceData.note
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        showToast('Absensi berhasil diperbarui');
        return data[0];
    } catch (error) {
        console.error('❌ Error updating:', error);
        showToast('Gagal update: ' + error.message, 'error');
        return null;
    }
}

async function deleteAttendance(id) {
    try {
        const { error } = await supabaseClient.from('attendance').delete().eq('id', id);
        if (error) throw error;
        
        showToast('Data absensi dihapus');
        return true;
    } catch (error) {
        console.error('❌ Error deleting:', error);
        showToast('Gagal hapus: ' + error.message, 'error');
        return false;
    }
}

async function adminUpsertAttendance(dataPayload) {
    try {
        console.log('🔧 Admin upsert:', dataPayload);

        const { data: existing, error: fetchError } = await supabaseClient
            .from('attendance')
            .select('id')
            .eq('user_id', dataPayload.userId)
            .eq('date', dataPayload.date)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        let result;
        if (existing) {
            // UPDATE
            const { data, error } = await supabaseClient
                .from('attendance')
                .update({
                    status: dataPayload.status,
                    time: dataPayload.time,
                    note: dataPayload.note
                })
                .eq('id', existing.id)
                .select();
            
            if (error) throw error;
            result = data;
        } else {
            // INSERT
            const { data, error } = await supabaseClient
                .from('attendance')
                .insert([{
                    user_id: dataPayload.userId,
                    date: dataPayload.date,
                    status: dataPayload.status,
                    time: dataPayload.time,
                    note: dataPayload.note
                }])
                .select();
            
            if (error) throw error;
            result = data;
        }

        showToast('Data berhasil diperbarui');
        return result;
    } catch (error) {
        console.error('❌ Error upsert:', error);
        showToast('Gagal update: ' + error.message, 'error');
        return null;
    }
}

// --- SEED DATA ---

async function seedInitialData() {
    try {
        console.log('🌱 Checking seed...');
        
        const { data: existing } = await supabaseClient
            .from('users')
            .select('id')
            .limit(1);
        
        if (existing && existing.length > 0) {
            console.log('✅ Data exists, skip seed');
            return;
        }
        
        const initialUsers = [
            { name: 'Akhmad Qusyaeri, S.TP', position: 'Wakil Sekretaris', username: 'qusyay' },
            { name: 'Yunita Damayanti Alaina', position: 'Akuntan/Kepala Kantor', username: 'yuni' },
            { name: 'Rendy Febriyan Ghofuri', position: 'Kepala Bagian Keuangan', username: 'rendy' },
            { name: 'Isma Alfian Fauzi', position: 'Staf Adm dan Proposal', username: 'isma' },
            { name: 'Nur Na\'imah', position: 'Staf Keuangan', username: 'naim' },
            { name: 'Ricko Yanuar Romadhon', position: 'Security', username: 'ricko' },
            { name: 'Setija Budi Adi Pranoto', position: 'Security', username: 'budi' },
            { name: 'Ahmad Faisal Firmansyah', position: 'Munazhzhif', username: 'faisal' },
            { name: 'Muhammad Mustofa Syafiq', position: 'IT dan Web', username: 'syaf' },
            { name: 'Umar Faruq', position: 'Ketua Produksi Konten', username: 'umar' },
            { name: 'Ibad Abdullah', position: 'Medsos dan Digital', username: 'ibad' },
            { name: 'Jundi Habibbulloh', position: 'Tim Produksi Konten', username: 'jundi' },
            { name: 'Abdullah Zaki', position: 'Koordinator FR dan LMI', username: 'zaki' },
            { name: 'Muhammad Ihsanudin', position: 'Ketua Tim Event dan Lap', username: 'ihsan' },
            { name: 'Muhammad Shibghatul Haq', position: 'Staf Bagian Event', username: 'igo' },
            { name: 'Hamzan Wadi', position: 'Tim Produksi Kontent', username: 'hamzan' },
            { name: 'Didik Suhartono', position: 'Ketua Tim Hub Donatur', username: 'didik' },
            { name: 'Hammam Iqomatuddin', position: 'Staf Hub Donatur', username: 'hammam' },
            { name: 'Moh. Sukris Budiyanto', position: 'Staf Hub Donatur', username: 'sukris' }
        ];
        
        const { error } = await supabaseClient.from('users').insert(initialUsers);
        if (error) throw error;
        
        console.log('✅ Seed completed');
        showToast('Data awal dimuat');
    } catch (error) {
        console.error('❌ Error seeding:', error);
    }
}

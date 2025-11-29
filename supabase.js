// ============================================
// SUPABASE CONNECTION & DATABASE OPERATIONS
// ============================================

// Konfigurasi Supabase
const SUPABASE_URL = 'https://zpyyozjxoklmftpunmlo.supabase.co'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXlvemp4b2tsbWZ0cHVubWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTUyNzQsImV4cCI6MjA3OTg3MTI3NH0.m4vQK00fIS3YoYMDy5isjDqAt2Ls05OeejFonSvom68'; // Ganti dengan Anon Key Anda

// Inisialisasi Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// HELPER FUNCTIONS - TIMEZONE JAKARTA (UTC+7)
// ============================================

/**
 * Dapatkan tanggal hari ini dalam timezone Jakarta (YYYY-MM-DD)
 */
function getTodayDateJakarta() {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = jakartaTime.getFullYear();
    const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
    const day = String(jakartaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Dapatkan waktu sekarang dalam format HH:MM (timezone Jakarta)
 */
function getCurrentTimeJakarta() {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const hours = String(jakartaTime.getHours()).padStart(2, '0');
    const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

// --- USERS / PEGAWAI ---

/**
 * Ambil semua data pegawai dari database
 */
async function fetchUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Gagal memuat data pegawai', 'error');
        return [];
    }
}

/**
 * Tambah pegawai baru
 */
async function createUser(userData) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                name: userData.name,
                position: userData.position,
                username: userData.username
            }])
            .select();
        
        if (error) throw error;
        showToast('Pegawai berhasil ditambahkan');
        return data[0];
    } catch (error) {
        console.error('Error creating user:', error);
        showToast('Gagal menambahkan pegawai', 'error');
        return null;
    }
}

/**
 * Update data pegawai
 */
async function updateUser(id, userData) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({
                name: userData.name,
                position: userData.position,
                username: userData.username
            })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        showToast('Data pegawai berhasil diperbarui');
        return data[0];
    } catch (error) {
        console.error('Error updating user:', error);
        showToast('Gagal memperbarui data pegawai', 'error');
        return null;
    }
}

/**
 * Hapus pegawai
 */
async function deleteUser(id) {
    try {
        // Hapus data absensi terkait terlebih dahulu
        await supabase
            .from('attendance')
            .delete()
            .eq('user_id', id);
        
        // Hapus user
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        showToast('Pegawai berhasil dihapus');
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Gagal menghapus pegawai', 'error');
        return false;
    }
}

/**
 * Cek apakah username sudah digunakan
 */
async function checkUsernameExists(username, excludeId = null) {
    try {
        let query = supabase
            .from('users')
            .select('id')
            .eq('username', username);
        
        if (excludeId) {
            query = query.neq('id', excludeId);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data.length > 0;
    } catch (error) {
        console.error('Error checking username:', error);
        return false;
    }
}

// --- ATTENDANCE / ABSENSI ---

/**
 * Ambil semua data absensi
 */
async function fetchAttendance() {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching attendance:', error);
        showToast('Gagal memuat data absensi', 'error');
        return [];
    }
}

/**
 * Ambil absensi berdasarkan user ID
 */
async function fetchAttendanceByUser(userId) {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user attendance:', error);
        return [];
    }
}

/**
 * Ambil absensi berdasarkan bulan
 */
async function fetchAttendanceByMonth(yearMonth) {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .gte('date', `${yearMonth}-01`)
            .lte('date', `${yearMonth}-31`)
            .order('date', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching monthly attendance:', error);
        return [];
    }
}

/**
 * Cek apakah user sudah absen hari ini
 */
async function checkTodayAttendance(userId) {
    try {
        const today = getTodayDateJakarta(); // ← DIGANTI INI
        
        console.log('🔍 Checking attendance for:', { userId, date: today });
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        return data || null;
    } catch (error) {
        console.error('Error checking today attendance:', error);
        return null;
    }
}

/**
 * Tambah data absensi baru
 */
async function createAttendance(attendanceData) {
    try {
        // Validasi: cek apakah sudah absen hari ini
        const todayDate = getTodayDateJakarta();
        
        console.log('💾 Creating attendance:', {
            userId: attendanceData.userId,
            date: attendanceData.date,
            todayDate: todayDate,
            status: attendanceData.status
        });
        
        // Cek duplikasi
        const { data: existingData, error: checkError } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', attendanceData.userId)
            .eq('date', attendanceData.date);
        
        if (checkError) throw checkError;
        
        if (existingData && existingData.length > 0) {
            console.log('⚠️ Already submitted today:', existingData[0]);
            showToast('Anda sudah absen hari ini!', 'error');
            return null;
        }
        
        // Insert data baru
        const { data, error } = await supabase
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
        showToast('Absensi berhasil disimpan!');
        return data[0];
    } catch (error) {
        console.error('Error creating attendance:', error);
        showToast('Gagal menyimpan absensi', 'error');
        return null;
    }
}

/**
 * Update data absensi (jika diperlukan)
 */
async function updateAttendance(id, attendanceData) {
    try {
        const { data, error } = await supabase
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
        console.error('Error updating attendance:', error);
        showToast('Gagal memperbarui absensi', 'error');
        return null;
    }
}

/**
 * Hapus data absensi (untuk admin)
 */
async function deleteAttendance(id) {
    try {
        const { error } = await supabase
            .from('attendance')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        showToast('Data absensi berhasil dihapus');
        return true;
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showToast('Gagal menghapus data absensi', 'error');
        return false;
    }
}

// ============================================
// SEED INITIAL DATA (Opsional)
// ============================================

/**
 * Seed data awal jika database kosong
 */
async function seedInitialData() {
    try {
        // Cek apakah sudah ada data
        const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        
        if (existingUsers && existingUsers.length > 0) {
            console.log('Data sudah ada, skip seeding');
            return;
        }
        
        // Data pegawai awal
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
        
        const { error } = await supabase
            .from('users')
            .insert(initialUsers);
        
        if (error) throw error;
        console.log('Data awal berhasil ditambahkan');
        showToast('Data awal berhasil dimuat');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

// ============================================
// EXPORT FUNCTIONS (jika menggunakan modules)
// ============================================

// Jika Anda menggunakan ES6 modules, uncomment baris di bawah:
// export {
//     fetchUsers,
//     createUser,
//     updateUser,
//     deleteUser,
//     checkUsernameExists,
//     fetchAttendance,
//     fetchAttendanceByUser,
//     fetchAttendanceByMonth,
//     checkTodayAttendance,
//     createAttendance,
//     updateAttendance,
//     deleteAttendance,
//     seedInitialData
// };

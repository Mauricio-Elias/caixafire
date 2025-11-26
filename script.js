// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgklyGbyyF-LYSF6OfuV01kxLhkAFB4s0",
  authDomain: "caixa-seriemas.firebaseapp.com",
  projectId: "caixa-seriemas",
  storageBucket: "caixa-seriemas.firebasestorage.app",
  messagingSenderId: "587214326834",
  appId: "1:587214326834:web:ddc16f790b940ed87fc02b",
  measurementId: "G-15CS643Y8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);// --- Configuração do Firebase ---
// IMPORTANTE: Substitua estas configurações pelas suas próprias credenciais do Firebase
// Veja o arquivo README.md para instruções detalhadas
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
let db;
let transactionsRef;

// Função para inicializar o Firebase
const initFirebase = () => {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        transactionsRef = db.ref('transactions');
        
        // Escutar mudanças em tempo real
        transactionsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                transactions = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Ordenar por data (mais recentes primeiro)
                transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            } else {
                transactions = [];
            }
            render();
        });
        
        console.log('Firebase conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar com Firebase:', error);
        alert('Erro ao conectar com o banco de dados. Verifique as configurações do Firebase.');
    }
};

// --- Variáveis de Estado Global ---
let transactions = [];
let filter = '';
let isModalOpen = false;
let editingTransaction = null;
let deleteModalOpen = false;
let transactionToDelete = null;
let modalCurrentType = 'expense';

// --- Constantes ---
const LOGO_URL = "logo seriemas.png";

const CATEGORIES = [
    'Material de Escritório', 'Alimentação', 'Transporte', 
    'Limpeza', 'Manutenção', 'Reposição de Caixa', 'Outros'
];

// --- Funções de Ajuda (Ícones SVG e Formatação) ---

const getIcon = (name, classes = "w-6 h-6") => {
    const icons = {
        Wallet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M21 12V7H5a2 2 0 0 1 0-4h16"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h-2"/><path d="M10 12V7"/></svg>`,
        TrendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><polyline points="22 7 13.5 15.5 10.14 12.14 4 18"/><polyline points="16 7 22 7 22 13"/></svg>`,
        TrendingDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><polyline points="22 17 13.5 8.5 10.14 11.86 4 6"/><polyline points="16 17 22 17 22 11"/></svg>`,
        Plus: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
        Trash2: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
        Search: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
        PieChart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
        ArrowUpCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>`,
        ArrowDownCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>`,
        X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
        Pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
        AlertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14a2 2 0 0 0 1.74 3H19.9a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
        Building2: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${classes}"><path d="M6 15v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3"/><path d="M18 8v7"/><path d="M14 12V8"/><path d="M10 16v-4"/><path d="M6 18v-7c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v7"/><path d="M10 8h4"/><path d="M2 22h20"/><path d="M3 7l9-4 9 4"/></svg>`
    };
    return icons[name] || '';
};

const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// --- Funções de Manipulação de Dados (CRUD com Firebase) ---

const handleSaveTransaction = (description, amount, type, category, isEditing) => {
    const transactionData = {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: isEditing ? editingTransaction.date : new Date().toISOString(),
    };

    if (isEditing) {
        // Atualizar transação existente no Firebase
        transactionsRef.child(editingTransaction.id).update(transactionData)
            .then(() => {
                console.log('Transação atualizada com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao atualizar transação:', error);
                alert('Erro ao atualizar transação. Tente novamente.');
            });
    } else {
        // Criar nova transação no Firebase
        transactionsRef.push(transactionData)
            .then(() => {
                console.log('Transação criada com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao criar transação:', error);
                alert('Erro ao criar transação. Tente novamente.');
            });
    }
    
    closeModal();
};

const executeDelete = () => {
    if (transactionToDelete) {
        transactionsRef.child(transactionToDelete).remove()
            .then(() => {
                console.log('Transação excluída com sucesso!');
            })
            .catch((error) => {
                console.error('Erro ao excluir transação:', error);
                alert('Erro ao excluir transação. Tente novamente.');
            });
    }
    setDeleteModalOpen(false);
};

// --- Gerenciamento de Modais ---

const openNewTransactionModal = () => {
    editingTransaction = null;
    modalCurrentType = 'expense';
    isModalOpen = true;
    render();
};

const openEditModal = (id) => {
    editingTransaction = transactions.find(t => t.id === id);
    if (editingTransaction) {
        modalCurrentType = editingTransaction.type;
    }
    isModalOpen = true;
    render();
};

const closeModal = () => {
    isModalOpen = false;
    editingTransaction = null;
    render();
};

const confirmDelete = (id) => {
    transactionToDelete = id;
    setDeleteModalOpen(true);
};

const setDeleteModalOpen = (open) => {
    deleteModalOpen = open;
    transactionToDelete = open ? transactionToDelete : null;
    render();
};

// --- Funções de Renderização ---

const renderStatCard = (title, value, type, iconName) => {
    let colors = '';
    let subtextColor = '';
    
    if (type === 'balance') {
        colors = 'bg-orange-600 text-white';
        subtextColor = 'text-orange-100';
    } else if (type === 'income') {
        colors = 'bg-orange-500 text-white';
        subtextColor = 'text-orange-100';
    } else if (type === 'expense') {
        colors = 'bg-gray-700 text-white';
        subtextColor = 'text-gray-300';
    } else {
        colors = 'bg-white text-gray-800 border';
        subtextColor = 'text-gray-500';
    }

    return `
        <div class="${colors} rounded-2xl p-6 shadow-sm border-gray-200">
            <div class="flex items-center justify-between">
                <div>
                    <p class="${subtextColor} text-sm font-medium mb-1">${title}</p>
                    <p class="text-2xl font-bold">${formatMoney(value)}</p>
                </div>
                <div class="opacity-80">
                    ${getIcon(iconName, 'w-8 h-8')}
                </div>
            </div>
        </div>
    `;
};

const renderHeader = () => {
    return `
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <img src="${LOGO_URL}" alt="Logo Seriemas" class="h-12 w-auto" onerror="this.style.display='none'">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">Controle de Caixa Rotativo</h1>
                            <p class="text-sm text-gray-500">CONSÓRCIO SERIEMAS</p>
                        </div>
                    </div>
                    <button 
                        onclick="openNewTransactionModal()"
                        class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                        ${getIcon('Plus', 'w-5 h-5')}
                        Nova Transação
                    </button>
                </div>
            </div>
        </header>
    `;
};

const renderTransactionModal = () => {
    if (!isModalOpen) return '';

    const isEditing = !!editingTransaction;
    const title = isEditing ? 'Editar Transação' : 'Nova Transação';
    const submitText = isEditing ? 'Salvar Alterações' : 'Adicionar';

    return `
        <div id="transactionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fade-in-up">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        ${getIcon('X', 'w-6 h-6')}
                    </button>
                </div>

                <form onsubmit="handleModalSubmit(event)" data-current-type="${modalCurrentType}" class="p-6 space-y-4">
                    <div id="modalTypeButtons" class="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onclick="setModalType('income')"
                            class="flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all"
                        >
                            ${getIcon('ArrowUpCircle', 'w-5 h-5')}
                            Entrada
                        </button>
                        <button 
                            type="button"
                            onclick="setModalType('expense')"
                            class="flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all"
                        >
                            ${getIcon('ArrowDownCircle', 'w-5 h-5')}
                            Saída
                        </button>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <input 
                            type="text" 
                            id="modalDescription"
                            value="${isEditing ? editingTransaction.description : ''}"
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Ex: Cartuchos de impressora"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                        <input 
                            type="number" 
                            id="modalAmount"
                            value="${isEditing ? editingTransaction.amount : ''}"
                            step="0.01"
                            min="0"
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0,00"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                        <select 
                            id="modalCategory"
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            ${CATEGORIES.map(cat => `
                                <option value="${cat}" ${isEditing && editingTransaction.category === cat ? 'selected' : ''}>
                                    ${cat}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button 
                            type="button"
                            onclick="closeModal()"
                            class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-all"
                        >
                            ${submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
};

const renderConfirmModal = () => {
    if (!deleteModalOpen) return '';

    return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full animate-fade-in-up">
                <div class="p-6 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        ${getIcon('AlertTriangle', 'w-6 h-6 text-red-600')}
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
                    <p class="text-sm text-gray-500 mb-6">
                        Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                    </p>
                    <div class="flex gap-3">
                        <button 
                            onclick="setDeleteModalOpen(false)"
                            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            onclick="executeDelete()"
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const renderMainContent = () => {
    const filteredTransactions = transactions.filter(t => {
        const searchTerm = filter.toLowerCase();
        return t.description.toLowerCase().includes(searchTerm) || 
               t.category.toLowerCase().includes(searchTerm);
    });

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const tableRows = filteredTransactions.length === 0 ? `
        <div class="p-12 text-center text-gray-400">
            <p class="text-lg">Nenhuma transação encontrada</p>
            <p class="text-sm mt-2">Adicione uma nova transação para começar</p>
        </div>
    ` : `
        <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${filteredTransactions.map(t => `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${formatDate(t.date)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            <div class="flex items-center gap-2">
                                ${t.type === 'income' ? getIcon('ArrowUpCircle', 'w-4 h-4 text-orange-500') : getIcon('ArrowDownCircle', 'w-4 h-4 text-gray-500')}
                                ${t.description}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${t.category}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${t.type === 'income' ? 'text-orange-600' : 'text-gray-900'}">
                            ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                                onclick="openEditModal('${t.id}')"
                                class="text-orange-600 hover:text-orange-900 mr-3"
                                title="Editar"
                            >
                                ${getIcon('Pencil', 'w-4 h-4')}
                            </button>
                            <button 
                                onclick="confirmDelete('${t.id}')"
                                class="text-red-600 hover:text-red-900"
                                title="Excluir"
                            >
                                ${getIcon('Trash2', 'w-4 h-4')}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    return `
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${renderStatCard('Saldo Atual', balance, 'balance', 'Wallet')}
                ${renderStatCard('Total de Entradas', totalIncome, 'income', 'TrendingUp')}
                ${renderStatCard('Total de Saídas', totalExpense, 'expense', 'TrendingDown')}
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 class="text-lg font-bold text-gray-700 flex items-center gap-2">
                        ${getIcon('PieChart', 'text-gray-400 w-5 h-5')}
                        Histórico de Movimentações
                    </h2>
                    
                    <div class="relative w-full sm:w-64">
                        ${getIcon('Search', 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4')}
                        <input 
                            id="filterInput"
                            type="text" 
                            placeholder="Buscar descrição ou categoria..." 
                            value="${filter}"
                            oninput="setFilter(this.value)"
                            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
                        />
                    </div>
                </div>

                <div class="overflow-x-auto" id="transactionsTable">
                    ${tableRows}
                </div>
            </div>
            
            <div class="text-center text-sm text-gray-400 mt-8">
                <p>Dados sincronizados em tempo real via Firebase</p>
            </div>
        </main>
    `;
};

// --- Funções de Manipulação da UI ---

const render = () => {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    appDiv.innerHTML = `
        <div class="min-h-screen bg-gray-100 text-gray-800 font-sans pb-20">
            ${renderHeader()}
            ${renderMainContent()}
            ${renderTransactionModal()}
            ${renderConfirmModal()}
        </div>
    `;
    
    const filterInput = document.getElementById('filterInput');
    if (filterInput) filterInput.value = filter;

    if (isModalOpen) {
        setModalType(modalCurrentType, false); 
    }
};

const setFilter = (value) => {
    filter = value;
    render(); 
};

const setModalType = (type, updateCategory = true) => {
    modalCurrentType = type;
    
    const form = document.querySelector('#transactionModal form');
    const incomeButton = document.querySelector('#modalTypeButtons button[onclick="setModalType(\'income\')"]');
    const expenseButton = document.querySelector('#modalTypeButtons button[onclick="setModalType(\'expense\')"]');
    const categorySelect = document.getElementById('modalCategory');

    if (form) form.dataset.currentType = type;

    if (incomeButton && expenseButton) {
        if (type === 'income') {
            incomeButton.className = 'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all bg-orange-100 text-orange-700 border-2 border-orange-500';
            expenseButton.className = 'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200';
            
            if (updateCategory && !editingTransaction && categorySelect) categorySelect.value = 'Reposição de Caixa';
        } else {
            incomeButton.className = 'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all bg-gray-100 text-gray-500 border-2 border-transparent hover:bg-gray-200';
            expenseButton.className = 'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all bg-gray-200 text-gray-800 border-2 border-gray-400';
            
            if (updateCategory && !editingTransaction && categorySelect) categorySelect.value = 'Outros';
        }
    }
};

const handleModalSubmit = (event) => {
    event.preventDefault();
    
    const form = event.target;
    const description = document.getElementById('modalDescription').value;
    const amount = document.getElementById('modalAmount').value;
    const type = form.dataset.currentType; 
    const category = document.getElementById('modalCategory').value;
    
    if (!description || !amount) return;

    const isEditing = !!editingTransaction;

    handleSaveTransaction(description, amount, type, category, isEditing);
};

// --- Inicialização ---

window.onload = () => {
    initFirebase();
};

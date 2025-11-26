
// ----- Imports Firebase (SDK modular v9+) -----
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  remove
} from "firebase/database";

// ----- Configuração Firebase -----
const firebaseConfig = {
  apiKey: "AIzaSyBgklyGbyyF-LYSF6OfuV01kxLhkAFB4s0",
  authDomain: "caixa-seriemas.firebaseapp.com",
  projectId: "caixa-seriemas",
  storageBucket: "caixa-seriemas.firebasestorage.app",
  messagingSenderId: "587214326834",
  appId: "1:587214326834:web:ddc16f790b940ed87fc02b",
  measurementId: "G-15CS643Y8R"
};

// ----- Estado Global -----
let transactions = [];
let filter = '';
let isModalOpen = false;
let editingTransaction = null;
let deleteModalOpen = false;
let transactionToDelete = null;
let modalCurrentType = 'expense';

// ----- Constantes -----
const LOGO_URL = "logo seriemas.png";
const CATEGORIES = [
  'Material de Escritório', 'Alimentação', 'Transporte',
  'Limpeza', 'Manutenção', 'Reposição de Caixa', 'Outros'
];

// ----- Helpers -----
const getIcon = (name, classes = "w-6 h-6") => {
  const icons = {
    Wallet: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"... class="${classes}">...</svg>`,
    // (mantenha seus SVGs originais aqui)
  };
  return icons[name] || '';
};

const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatMoney = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// ----- Firebase App + Database -----
let app;
let db;
let transactionsRef;

const initFirebase = async () => {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    transactionsRef = ref(db, 'transactions');

    // Analytics opcional (apenas se suportado)
    if (await analyticsIsSupported()) {
      try { getAnalytics(app); } catch (e) { /* ignora erros locais */ }
    }

    // Escutar mudanças em tempo real
    onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        transactions = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
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

// ----- CRUD -----
const handleSaveTransaction = (description, amount, type, category, isEditing) => {
  const transactionData = {
    description,
    amount: parseFloat(amount),
    type,
    category,
    date: isEditing ? editingTransaction.date : new Date().toISOString(),
  };

  if (isEditing && editingTransaction?.id) {
    update(ref(db, `transactions/${editingTransaction.id}`), transactionData)
      .then(() => console.log('Transação atualizada com sucesso!'))
      .catch((error) => {
        console.error('Erro ao atualizar transação:', error);
        alert('Erro ao atualizar transação. Tente novamente.');
      });
  } else {
    push(transactionsRef, transactionData)
      .then(() => console.log('Transação criada com sucesso!'))
      .catch((error) => {
        console.error('Erro ao criar transação:', error);
        alert('Erro ao criar transação. Tente novamente.');
      });
  }

  closeModal();
};

const executeDelete = () => {
  if (transactionToDelete) {
    remove(ref(db, `transactions/${transactionToDelete}`))
      .then(() => console.log('Transação excluída com sucesso!'))
      .catch((error) => {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao excluir transação. Tente novamente.');
      });
  }
  setDeleteModalOpen(false);
};

// ----- UI (mantive sua estrutura, corrigindo os pontos) -----
// ... (mantenha suas funções renderStatCard, renderHeader, renderTransactionModal, renderConfirmModal)
// As mudanças principais estão em renderMainContent (|| e escapeHtml) e handleModalSubmit (||)

const renderMainContent = () => {
  const searchTerm = filter.toLowerCase();
  const filteredTransactions = transactions.filter((t) => {
    return t.description.toLowerCase().includes(searchTerm) ||
           t.category.toLowerCase().includes(searchTerm);
  });

  const totalIncome = transactions.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions.filter(t => t.type === 'expense')
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(t.date)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">
              <div class="flex items-center gap-2">
                ${t.type === 'income' ? getIcon('ArrowUpCircle', 'w-4 h-4 text-orange-500') : getIcon('ArrowDownCircle', 'w-4 h-4 text-gray-500')}
                ${escapeHtml(t.description)}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(t.category)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${t.type === 'income' ? 'text-orange-600' : 'text-gray-900'}">
              ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button onclick="openEditModal('${t.id}')" class="text-orange-600 hover:text-orange-900 mr-3" title="Editar">
                ${getIcon('Pencil', 'w-4 h-4')}
              </button>
              <button onclick="confirmDelete('${t.id}')" class="text-red-600 hover:text-red-900" title="Excluir">
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
  if (isModalOpen) setModalType(modalCurrentType, false);
};

const setFilter = (value) => { filter = value; render(); };

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

const openNewTransactionModal = () => { editingTransaction = null; modalCurrentType = 'expense'; isModalOpen = true; render(); };
const openEditModal = (id) => {
  editingTransaction = transactions.find(t => t.id === id);
  if (editingTransaction) modalCurrentType = editingTransaction.type;
  isModalOpen = true; render();
};
const closeModal = () => { isModalOpen = false; editingTransaction = null; render(); };

const confirmDelete = (id) => { transactionToDelete = id; setDeleteModalOpen(true); };
const setDeleteModalOpen = (open) => { deleteModalOpen = open; if (!open) transactionToDelete = null; render(); };

// ----- Inicialização -----
window.onload = () => { initFirebase(); };

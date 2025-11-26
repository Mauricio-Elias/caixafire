
// firebase_firestore.js — Firebase modular v9+ usando Firestore
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// ---- Configuração Firebase (igual ao seu projeto) ----
const firebaseConfig = {
  apiKey: 'AIzaSyBgklyGbyyF-LYSF6OfuV01kxLhkAFB4s0',
  authDomain: 'caixa-seriemas.firebaseapp.com',
  projectId: 'caixa-seriemas',
  storageBucket: 'caixa-seriemas.firebasestorage.app',
  messagingSenderId: '587214326834',
  appId: '1:587214326834:web:ddc16f790b940ed87fc02b',
  measurementId: 'G-15CS643Y8R'
};

// ---- Estado global (igual ao seu app) ----
let transactions = [];
let filter = '';
let isModalOpen = false;
let editingTransaction = null;
let deleteModalOpen = false;
let transactionToDelete = null;
let modalCurrentType = 'expense';

// ---- Helpers UI (simplificados; adapte aos seus SVGs) ----
const formatMoney = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (ts) => {
  // ts pode ser FieldValue (serverTimestamp), Timestamp ou string
  let date;
  if (ts?.toDate) date = ts.toDate();        // Timestamp Firestore
  else if (typeof ts === 'string') date = new Date(ts);
  else date = new Date(); // fallback
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(date);
};

// ---- Firebase App + Firestore ----
let app;
let db;

const initFirebase = async () => {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    if (await analyticsIsSupported()) {
      try { getAnalytics(app); } catch (_) {}
    }

    // Stream em tempo real ordenado por data descendente
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    onSnapshot(q, (snapshot) => {
      transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    });

    console.log('Firestore conectado com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar com Firebase:', error);
    alert('Erro de conexão com o Firestore. Verifique a configuração.');
  }
};

// ---- CRUD Firestore ----
const handleSaveTransaction = async (description, amount, type, category, isEditing) => {
  const data = {
    description,
    amount: parseFloat(amount),
    type,
    category,
    // Use serverTimestamp() para ordenação e consistência
    date: isEditing && editingTransaction?.date ? editingTransaction.date : serverTimestamp(),
  };

  try {
    if (isEditing && editingTransaction?.id) {
      const refDoc = doc(db, 'transactions', editingTransaction.id);
      await updateDoc(refDoc, data);
      console.log('Transação atualizada!');
    } else {
      await addDoc(collection(db, 'transactions'), data);
      console.log('Transação criada!');
    }
    closeModal();
  } catch (e) {
    console.error('Erro ao salvar transação:', e);
    alert('Erro ao salvar. Tente novamente.');
  }
};

const executeDelete = async () => {
  if (!transactionToDelete) return;
  try {
    await deleteDoc(doc(db, 'transactions', transactionToDelete));
    console.log('Transação excluída!');
  } catch (e) {
    console.error('Erro ao excluir:', e);
    alert('Erro ao excluir. Tente novamente.');
  } finally {
    setDeleteModalOpen(false);
  }
};

// ---- UI mínima — substitua pelos seus componentes (renderHeader/renderMain etc.) ----
const render = () => {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;

  const filtered = transactions.filter(t => {
    const s = filter.toLowerCase();
    return (t.description || '').toLowerCase().includes(s) ||
           (t.category || '').toLowerCase().includes(s);
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  appDiv.innerHTML = `
    <div style="padding:16px;font-family:Arial, sans-serif">
      <h1>Controle de Caixa — Firestore</h1>
      <div style="margin:12px 0">
        <strong>Saldo:</strong> ${formatMoney(balance)} |
        <strong>Entradas:</strong> ${formatMoney(totalIncome)} |
        <strong>Saídas:</strong> ${formatMoney(totalExpense)}
      </div>

      <div style="margin:12px 0">
        <input id="filterInput" placeholder="Buscar..." value="${filter}" style="padding:6px;border:1px solid #ccc;border-radius:6px" />
        <button id="btnNew" style="margin-left:8px;padding:6px 10px;background:#ea580c;color:#fff;border:none;border-radius:6px">Nova Transação</button>
      </div>

      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Data/Hora</th>
            <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Descrição</th>
            <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Categoria</th>
            <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px">Valor</th>
            <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(t => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee">${formatDate(t.date)}</td>
              <td style="padding:8px;border-bottom:1px solid #eee">${t.description || ''}</td>
              <td style="padding:8px;border-bottom:1px solid #eee">${t.category || ''}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount || 0)}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
                <button data-edit="${t.id}" style="margin-right:8px">Editar</button>
                <button data-del="${t.id}" style="color:#fff;background:#ef4444;border:none;border-radius:4px;padding:4px 8px">Excluir</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${isModalOpen ? `
        <div id="modal" style="position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">
          <div style="background:#fff;padding:16px;border-radius:8px;min-width:320px">
            <h3>${editingTransaction ? 'Editar' : 'Nova'} Transação</h3>
            <div style="margin:8px 0">
              <label>Descrição</label>
              <input id="mDesc" value="${editingTransaction?.description || ''}" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px" />
            </div>
            <div style="margin:8px 0">
              <label>Valor (R$)</label>
              <input id="mAmt" type="number" step="0.01" value="${editingTransaction?.amount ?? ''}" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px" />
            </div>
            <div style="margin:8px 0">
              <label>Tipo</label>
              <select id="mType" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px">
                <option value="income" ${ (editingTransaction?.type || modalCurrentType) === 'income' ? 'selected' : '' }>Entrada</option>
                <option value="expense" ${ (editingTransaction?.type || modalCurrentType) === 'expense' ? 'selected' : '' }>Saída</option>
              </select>
            </div>
            <div style="margin:8px 0">
              <label>Categoria</label>
              <input id="mCat" value="${editingTransaction?.category || ''}" style="width:100%;padding:6px;border:1px solid #ccc;border-radius:6px" />
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <button id="mCancel">Cancelar</button>
              <button id="mSave" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px">${editingTransaction ? 'Salvar' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Eventos
  const fInput = document.getElementById('filterInput');
  if (fInput) fInput.oninput = (e) => { filter = e.target.value; render(); };

  const btnNew = document.getElementById('btnNew');
  if (btnNew) btnNew.onclick = () => { editingTransaction = null; isModalOpen = true; render(); };

  document.querySelectorAll('button[data-edit]').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-edit');
      editingTransaction = transactions.find(t => t.id === id) || null;
      isModalOpen = true;
      render();
    };
  });

  document.querySelectorAll('button[data-del]').forEach(b => {
    b.onclick = () => {
      transactionToDelete = b.getAttribute('data-del');
      setDeleteModalOpen(true);
    };
  });

  const mCancel = document.getElementById('mCancel');
  if (mCancel) mCancel.onclick = () => { closeModal(); };

  const mSave = document.getElementById('mSave');
  if (mSave) mSave.onclick = async () => {
    const desc = document.getElementById('mDesc').value;
    const amt  = document.getElementById('mAmt').value;
    const type = document.getElementById('mType').value;
    const cat  = document.getElementById('mCat').value;

    if (!desc || !amt) return alert('Preencha descrição e valor.');
    await handleSaveTransaction(desc, amt, type, cat, !!editingTransaction);
  };
};

const closeModal = () => { isModalOpen = false; editingTransaction = null; render(); };
const setDeleteModalOpen = (open) => {
  deleteModalOpen = open;
  if (!open) { transactionToDelete = null; }
  render();
};

// ---- Inicialização ----
window.onload = () => { initFirebase(); };

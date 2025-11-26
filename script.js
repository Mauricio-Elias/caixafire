// firebase.js atualizado (Firebase modular v9+)
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';
import { getDatabase, ref, onValue, push, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBgklyGbyyF-LYSF6OfuV01kxLhkAFB4s0',
  authDomain: 'caixa-seriemas.firebaseapp.com',
  projectId: 'caixa-seriemas',
  storageBucket: 'caixa-seriemas.firebasestorage.app',
  messagingSenderId: '587214326834',
  appId: '1:587214326834:web:ddc16f790b940ed87fc02b',
  measurementId: 'G-15CS643Y8R'
};

let app;
let db;
let transactionsRef;
let transactions = [];
let filter = '';
let isModalOpen = false;
let editingTransaction = null;
let deleteModalOpen = false;
let transactionToDelete = null;
let modalCurrentType = 'expense';

const initFirebase = async () => {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    transactionsRef = ref(db, 'transactions');

    if (await analyticsIsSupported()) {
      try { getAnalytics(app); } catch (e) {}
    }

    onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      transactions = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      render();
    });

    console.log('Firebase conectado com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar com Firebase:', error);
    alert('Erro ao conectar com o banco de dados. Verifique as configurações do Firebase.');
  }
};

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
      .catch((error) => alert('Erro ao atualizar transação. Tente novamente.'));
  } else {
    push(transactionsRef, transactionData)
      .then(() => console.log('Transação criada com sucesso!'))
      .catch((error) => alert('Erro ao criar transação. Tente novamente.'));
  }

  closeModal();
};

const executeDelete = () => {
  if (transactionToDelete) {
    remove(ref(db, `transactions/${transactionToDelete}`))
      .then(() => console.log('Transação excluída com sucesso!'))
      .catch((error) => alert('Erro ao excluir transação. Tente novamente.'));
  }
  setDeleteModalOpen(false);
};

// Funções de UI e renderização devem ser mantidas conforme seu projeto original
// Certifique-se de usar <script type="module" src="firebase.js"></script> no HTML

window.onload = () => { initFirebase(); };

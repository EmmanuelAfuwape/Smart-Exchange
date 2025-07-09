let mainBalance = localStorage.getItem('mainBalance') ? parseFloat(localStorage.getItem('mainBalance')) : 0;
let baseCurrency = localStorage.getItem('baseCurrency') || 'USD';
let exchangeRates = {};
let userCurrency = null;  // Cache user currency globally
let userCountry = null;   // Cache user country globally
let checkEmailAndPassword = null;

function setBaseCurrency() {
  const select = document.getElementById('base-currency');
  baseCurrency = select.value;
  localStorage.setItem('baseCurrency', baseCurrency);
  updateBalanceDisplay();
}

async function updateBalanceDisplay() {
  try {
    const res = await fetch('/user_info');
    if (!res.ok) throw new Error(`Failed to fetch user info: ${res.status} ${res.statusText}`);
    const data = await res.json();

    mainBalance = data.mainBalance || 0;
    baseCurrency = data.baseCurrency || 'USD';
    userCurrency = data.userCurrency || null;
    const localBalance = data.localBalance;
    const exchangeRate = data.exchangeRate;

    document.getElementById("main-balance").innerText = `${baseCurrency} ${mainBalance.toFixed(2)}`;

    if (localBalance !== null && userCurrency) {
      document.getElementById("local-balance").innerText = `${baseCurrency} ${mainBalance.toFixed(2)} / ${userCurrency} ${localBalance.toFixed(2)}`;
    } else {
      document.getElementById("local-balance").innerText = "Local currency balance unavailable.";
    }
  } catch (error) {
    console.error("Error in updateBalanceDisplay:", error);
    document.getElementById("local-balance").innerText = "Error fetching data...";
  }
}

// Toggle local currency display visibility
function toggleLocalBalance() {
  const localBalanceElem = document.getElementById("local-balance");
  const btn = document.getElementById("toggle-local-balance-btn");
  if (localBalanceElem.style.display === "none") {
    localBalanceElem.style.display = "block";
    btn.innerText = "Hide Local Currency Balance";
  } else {
    localBalanceElem.style.display = "none";
    btn.innerText = "Show Local Currency Balance";
  }
}

function saveTransaction(transaction) {
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
  const transactionTable = document.getElementById("transaction-table");
  // Clear existing rows except header
  while (transactionTable.rows.length > 1) {
    transactionTable.deleteRow(1);
  }

  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  if (transactions.length === 0) {
    const noTransactionsRow = document.createElement('tr');
    noTransactionsRow.id = 'no-transactions';
    noTransactionsRow.innerHTML = '<td colspan="3">No trsansactions have been done!</td>';
    transactionTable.appendChild(noTransactionsRow);
    return;
  }

  // Show only the 5 most recent transactions
  const recentTransactions = transactions.slice(-5).reverse();

  recentTransactions.forEach(tx => {
    const newRow = transactionTable.insertRow(-1);
    const dateCell = newRow.insertCell(0);
    const descCell = newRow.insertCell(1);
    const amountCell = newRow.insertCell(2);

    dateCell.innerText = tx.date;
    descCell.innerText = tx.description;

    // Show amount in base currency and local currency if available
    let baseAmount = (tx.amount < 0 ? '-' : '+') + baseCurrency + ' ' + Math.abs(tx.amount).toFixed(2);
    let localAmount = "N/A";

    if (userCurrency && exchangeRates[userCurrency]) {
      const rate = exchangeRates[userCurrency];
      const localValue = Math.abs(tx.amount) * rate;
      localAmount = (tx.amount < 0 ? '-' : '+') + userCurrency + ' ' + localValue.toFixed(2);
    } else {
      localAmount = "Currency not available"; // Optional: provide a message if currency is not available
    }

    amountCell.innerText = `${baseAmount} / ${localAmount}`;
  });
}

// Toggle transaction history visibility
function toggleTransactionHistory() {
  const container = document.getElementById("transaction-container");
  const btn = document.getElementById("toggle-transactions-btn");
  if (container.style.display === "none") {
    container.style.display = "block";
    btn.innerText = "Hide Transaction History";
  } else {
    container.style.display = "none";
    btn.innerText = "Show Transaction History";
  }
}

function makePayment() {
  const amountInput = document.getElementById("payment-amount");
  const amountLocal = parseFloat(amountInput.value);

  if (isNaN(amountLocal) || amountLocal <= 0) {
    alert("Please enter a valid payment amount greater than 0.");
    return;
  }

  if (!userCurrency || !exchangeRates[userCurrency]) {
    alert("Exchange rate unavailable for conversion.");
    return;
  }

  const rateToBase = 1 / exchangeRates[userCurrency];
  const amountBase = amountLocal * rateToBase;

  if (amountBase > mainBalance) {
    alert("Insufficient balance for this payment.");
    return;
  }

  mainBalance -= amountBase;
  localStorage.setItem('mainBalance', mainBalance.toFixed(2));
  updateBalanceDisplay();

  const now = new Date();
  saveTransaction({
    date: now.toLocaleDateString() + " " + now.toLocaleTimeString(),
    description: "Payment made",
    amount: -amountBase
  });
}

document.getElementById('base-currency').value = baseCurrency;

function makeWithdrawal() {
  const amountInput = document.getElementById("withdraw-amount");
  const amountLocal = parseFloat(amountInput.value);

  if (isNaN(amountLocal) || amountLocal <= 0) {
    alert("Please enter a valid withdrawal amount greater than 0.");
    return;
  }

  if (!userCurrency || !exchangeRates[userCurrency]) {
    alert("Exchange rate unavailable for conversion.");
    return;
  }

  const rateToBase = 1 / exchangeRates[userCurrency];
  const amountBase = amountLocal * rateToBase;

  if (amountBase > mainBalance) {
    alert("Insufficient balance for this withdrawal.");
    return;
  }

  mainBalance -= amountBase;
  localStorage.setItem('mainBalance', mainBalance.toFixed(2));
  updateBalanceDisplay();

  const now = new Date();
  saveTransaction({
    date: now.toLocaleDateString() + " " + now.toLocaleTimeString(),
    description: "Withdrawal made",
    amount: -amountBase
  });

  amountInput.value = "";
  loadTransactions();
}

updateBalanceDisplay();


export async function loadHardhatAccounts() {
    try {
      const resp = await fetch("/hardhat_accounts.json");
      const data = await resp.json();
      return data;
    } catch (err) {
      console.error("Ne mogu učitati Hardhat račune:", err);
      return [];
    }
  }
const STORAGE_KEYS = {
  user: 'currentUser',
  users: 'registeredUsers',
  reviews: 'reviews',
  support: 'supportTickets',
  inventory: 'inventoryKeys',
  sold: 'soldKeys',
  orders: 'orders'
};

function readJSON(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function currentUser() { return readJSON(STORAGE_KEYS.user, null); }
function isLoggedIn() { return !!currentUser(); }
function getUsers() {
  const seeded = [{id:'demo-user', name:'Демо-покупатель', email:'test@mail.com', password:'demo123', role:'customer', status:'active', registeredAt:'2026-09-30'}];
  const users = readJSON(STORAGE_KEYS.users, null);
  if (!users) { writeJSON(STORAGE_KEYS.users, seeded); return seeded; }
  return users;
}
function updateCartCountGlobal() {
  const cart = readJSON('cart', []);
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}
function updateUserBadge() {
  const user = currentUser();
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user ? user.name : 'Гость');
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user ? user.email : 'Войдите в аккаунт');
  document.querySelectorAll('[data-auth-link]').forEach(el => {
    el.textContent = user ? 'Выйти' : 'Войти';
    el.href = user ? '#' : 'auth.html';
    if (user) el.onclick = e => { e.preventDefault(); logout(); };
  });
}
function bootStore() { getUsers(); updateCartCountGlobal(); updateUserBadge(); }
function requireAuth(message='Войдите в аккаунт, чтобы продолжить.') {
  if (isLoggedIn()) return true;
  const status = document.querySelector('#auth-status');
  if (status) { status.className='form-status error'; status.textContent=message; }
  else window.location.href='auth.html?return=' + encodeURIComponent(location.pathname.split('/').pop() || 'main.html');
  return false;
}
function registerUser(name,email,password) {
  const users = getUsers();
  email = email.trim().toLowerCase();
  if (!name.trim() || !email || password.length < 6) return {ok:false,error:'Заполните имя, email и пароль минимум из 6 символов.'};
  if (users.some(u=>u.email===email)) return {ok:false,error:'Пользователь с таким email уже зарегистрирован.'};
  const user={id:'user-'+Date.now(),name:name.trim(),email,password,role:'customer',status:'active',registeredAt:new Date().toISOString().slice(0,10)};
  users.push(user); writeJSON(STORAGE_KEYS.users,users); writeJSON(STORAGE_KEYS.user,user); return {ok:true,user};
}
function loginUser(email,password) {
  const user=getUsers().find(u=>u.email===email.trim().toLowerCase() && u.password===password);
  if(!user) return {ok:false,error:'Неверный email или пароль.'};
  writeJSON(STORAGE_KEYS.user,user); return {ok:true,user};
}
function logout(){ localStorage.removeItem(STORAGE_KEYS.user); updateUserBadge(); window.location.href='main.html'; }
function getUserOrders(){ const u=currentUser(); if(!u) return []; return readJSON(STORAGE_KEYS.orders,[]).filter(o=>o.userId===u.id || o.email===u.email); }
async function loadJSON(file,fallback){try{const r=await fetch(file,{cache:'no-store'});if(!r.ok)throw new Error();return await r.json();}catch{return fallback;}}
async function ensureInventory(){
  const existing=localStorage.getItem(STORAGE_KEYS.inventory);
  if(existing) return readJSON(STORAGE_KEYS.inventory,[]);
  const data=await loadJSON('database.json',{keys:[]});
  const soldIds=new Set(readJSON(STORAGE_KEYS.sold,[]).map(k=>k.keyId));
  const keys=(data.keys||[]).filter(k=>k.status!=='sold' && k.isUsed!==true && !soldIds.has(k.id));
  writeJSON(STORAGE_KEYS.inventory,keys); return keys;
}
function getAvailableInventory(){return readJSON(STORAGE_KEYS.inventory,[]).filter(k=>k.status!=='sold');}
function stockCount(gameId){return getAvailableInventory().filter(k=>Number(k.gameId)===Number(gameId)).length;}
function findInventoryKeys(gameId,qty){return getAvailableInventory().filter(k=>Number(k.gameId)===Number(gameId)).slice(0,qty);}
function moveKeysToSold(selected,order){
  const ids=new Set(selected.map(k=>k.id));
  const inventory=getAvailableInventory().filter(k=>!ids.has(k.id));
  const sold=readJSON(STORAGE_KEYS.sold,[]);
  const soldRecords=selected.map(k=>({...k,status:'sold',soldAt:order.date,orderId:order.id,userId:order.userId,email:order.email,price:order.items.find(i=>Number(i.gameId)===Number(k.gameId))?.price||0}));
  writeJSON(STORAGE_KEYS.inventory,inventory); writeJSON(STORAGE_KEYS.sold,[...sold,...soldRecords]);
}
window.addToCart=function(id,name,price,image,btn){
  const available=stockCount(id); const cart=readJSON('cart',[]); const item=cart.find(x=>Number(x.id)===Number(id)); const wanted=(item?.quantity||0)+1;
  if(available<wanted){ if(btn){btn.textContent='Нет в наличии';setTimeout(()=>btn.textContent='В корзину',1000);} return; }
  if(item)item.quantity=wanted;else cart.push({id:Number(id),name,price:Number(price),image:image||'',quantity:1});
  writeJSON('cart',cart); updateCartCountGlobal(); if(btn){const old=btn.textContent;btn.textContent='Добавлено';setTimeout(()=>btn.textContent=old,900);}
};

document.addEventListener('DOMContentLoaded',bootStore);
window.GameKeys={readJSON,writeJSON,currentUser,isLoggedIn,registerUser,loginUser,logout,getUsers,requireAuth,ensureInventory,getAvailableInventory,stockCount,findInventoryKeys,moveKeysToSold,getUserOrders,updateCartCountGlobal,updateUserBadge};

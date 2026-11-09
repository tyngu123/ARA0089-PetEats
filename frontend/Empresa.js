import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { request } from './src/api';
import {
  Chip,
  Field,
  GreenHeader,
  PrimaryButton,
  ProductIcon,
  StateCard,
  StatusBadge,
  Text,
  confirmAction,
  formatBRL,
  formatTime,
  showMessage,
} from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const POLL_MS = 4000;
const CATEGORIES = ['Ração cães', 'Ração gatos', 'Petiscos', 'Outros'];

// Próxima ação que a empresa pode fazer em cada status.
const ACTIONS = {
  pendente: [
    { status: 'recusado', label: 'Recusar', icon: 'close', variant: 'outline', confirm: 'Recusar este pedido?' },
    { status: 'aceito', label: 'Aceitar pedido', icon: 'checkmark', variant: 'green' },
  ],
  aceito: [{ status: 'enviado', label: 'Enviar pedido', icon: 'bicycle', variant: 'orange' }],
  enviado: [{ status: 'entregue', label: 'Marcar como entregue', icon: 'checkmark-done', variant: 'green' }],
};

const OrderCard = ({ order, onAction, busy }) => (
  <View style={[styles.card, order.status === 'pendente' && styles.cardNew]}>
    <View style={styles.cardTop}>
      <Text style={styles.orderNumber}>Pedido nº {String(order.id).padStart(4, '0')}</Text>
      <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
    </View>
    <StatusBadge status={order.status} />

    <View style={styles.customer}>
      <Ionicons color={colors.primary} name="person-circle-outline" size={20} />
      <Text style={styles.customerText}>
        {order.customerName}
        {order.customerPhone ? ` · ${order.customerPhone}` : ''}
      </Text>
    </View>
    <View style={styles.customer}>
      <Ionicons color={colors.primary} name="location-outline" size={18} />
      <Text style={styles.customerText}>{order.address}</Text>
    </View>

    <View style={styles.items}>
      {order.items.map((item) => (
        <View key={item.productId} style={styles.itemRow}>
          <Text style={styles.itemText}>
            {item.quantity}x {item.name}
          </Text>
          <Text style={[styles.itemText, styles.amount]}>{formatBRL(item.unitPrice * item.quantity)}</Text>
        </View>
      ))}
      <View style={[styles.itemRow, styles.totalRow]}>
        <Text style={styles.totalText}>Total ({order.paymentMethod})</Text>
        <Text style={styles.totalText}>{formatBRL(order.total)}</Text>
      </View>
      {order.notes ? <Text style={styles.notes}>Obs.: {order.notes}</Text> : null}
    </View>

    {ACTIONS[order.status] ? (
      <View style={styles.actions}>
        {ACTIONS[order.status].map((action) => (
          <PrimaryButton
            key={action.status}
            icon={action.icon}
            label={action.label}
            loading={busy === `${order.id}-${action.status}`}
            disabled={Boolean(busy)}
            style={styles.actionButton}
            variant={action.variant}
            onPress={() => onAction(order, action)}
          />
        ))}
      </View>
    ) : null}
  </View>
);

const PedidosTab = ({ orders, error, onAction, busy }) => {
  const [filter, setFilter] = useState('abertos');
  if (!orders) {
    return error ? (
      <StateCard icon="cloud-offline-outline" text={error} title="Não foi possível carregar" />
    ) : (
      <StateCard loading text="Carregando pedidos..." />
    );
  }

  const open = orders.filter((order) => ['pendente', 'aceito', 'enviado'].includes(order.status));
  const closed = orders.filter((order) => !['pendente', 'aceito', 'enviado'].includes(order.status));
  const list = filter === 'abertos' ? open : closed;

  return (
    <>
      <View style={styles.filters}>
        <Chip active={filter === 'abertos'} label={`Em aberto (${open.length})`} onPress={() => setFilter('abertos')} />
        <Chip active={filter === 'finalizados'} label={`Finalizados (${closed.length})`} onPress={() => setFilter('finalizados')} />
      </View>
      {list.length === 0 ? (
        <StateCard
          icon="notifications-outline"
          text={filter === 'abertos' ? 'Os novos pedidos aparecem aqui automaticamente.' : 'Nenhum pedido finalizado ainda.'}
          title={filter === 'abertos' ? 'Aguardando pedidos' : 'Sem histórico'}
        />
      ) : (
        list.map((order) => <OrderCard key={order.id} busy={busy} order={order} onAction={onAction} />)
      )}
    </>
  );
};

const ProdutosTab = ({ token }) => {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', category: CATEGORIES[0] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    request('/api/my/products', { token })
      .then((data) => setProducts(data.products))
      .catch((error) => showMessage('Erro', error.message));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      showMessage('Campos obrigatórios', 'Informe nome e preço do produto.');
      return;
    }
    setSaving(true);
    try {
      await request('/api/my/products', { method: 'POST', token, body: form });
      setForm({ name: '', price: '', description: '', category: form.category });
      load();
    } catch (error) {
      showMessage('Não foi possível salvar', error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (product) => {
    try {
      await request(`/api/my/products/${product.id}`, {
        method: 'PATCH',
        token,
        body: { isActive: !product.isActive },
      });
      load();
    } catch (error) {
      showMessage('Erro', error.message);
    }
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.formTitle}>Novo produto</Text>
        <Field label="Nome" placeholder="Ex.: Ração Adulto 10 kg" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Field
          keyboardType="decimal-pad"
          label="Preço (R$)"
          placeholder="Ex.: 89,90"
          value={form.price}
          onChangeText={(price) => setForm({ ...form, price })}
        />
        <Field
          label="Descrição (opcional)"
          placeholder="Ex.: Para cães adultos de porte médio"
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
        />
        <View style={styles.filters}>
          {CATEGORIES.map((category) => (
            <Chip key={category} active={form.category === category} label={category} onPress={() => setForm({ ...form, category })} />
          ))}
        </View>
        <PrimaryButton icon="add" label="Adicionar ao catálogo" loading={saving} variant="orange" onPress={save} />
      </View>

      {!products && <StateCard loading text="Carregando produtos..." />}
      {products?.map((product) => (
        <View key={product.id} style={[styles.productRow, !product.isActive && { opacity: 0.55 }]}>
          <ProductIcon category={product.category} size={22} style={styles.productIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productMeta}>
              {product.category} · {formatBRL(product.price)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={[styles.toggle, product.isActive ? styles.toggleOn : styles.toggleOff]}
            onPress={() => toggle(product)}
          >
            <Text style={[styles.toggleText, product.isActive && { color: colors.primary }]}>
              {product.isActive ? 'À venda' : 'Pausado'}
            </Text>
          </Pressable>
        </View>
      ))}
    </>
  );
};

const Empresa = () => {
  const { token, shop, logout } = useAuth();
  const [tab, setTab] = useState('pedidos');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [newAlert, setNewAlert] = useState(false);
  const knownPending = useRef(null);

  // Busca os pedidos da loja a cada 4 segundos: pedidos novos chegam sozinhos.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const data = await request('/api/orders', { token });
          if (!active) return;
          const pendingIds = data.orders.filter((order) => order.status === 'pendente').map((order) => order.id);
          if (knownPending.current && pendingIds.some((id) => !knownPending.current.includes(id))) {
            setNewAlert(true);
          }
          if (pendingIds.length === 0) setNewAlert(false);
          knownPending.current = pendingIds;
          setOrders(data.orders);
          setError(null);
        } catch (loadError) {
          if (active) setError(loadError.message);
        }
      };
      load();
      const timer = setInterval(load, POLL_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [token])
  );

  const changeStatus = async (order, action) => {
    if (action.confirm && !(await confirmAction(action.confirm, 'O cliente será avisado no aplicativo.', action.label))) {
      return;
    }
    setBusy(`${order.id}-${action.status}`);
    try {
      const data = await request(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        token,
        body: { status: action.status },
      });
      setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
    } catch (actionError) {
      showMessage('Não foi possível atualizar', actionError.message);
    } finally {
      setBusy(null);
    }
  };

  const pendingCount = orders?.filter((order) => order.status === 'pendente').length || 0;

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
      <GreenHeader
        right={
          <Pressable accessibilityLabel="Sair da conta" accessibilityRole="button" hitSlop={10} onPress={logout}>
            <Ionicons color={colors.surface} name="log-out-outline" size={24} />
          </Pressable>
        }
        subtitle="Painel da empresa"
        title={shop?.name || 'Minha loja'}
      >
        <View style={styles.tabs}>
          {[
            { id: 'pedidos', label: `Pedidos${pendingCount ? ` (${pendingCount} novo${pendingCount > 1 ? 's' : ''})` : ''}`, icon: 'receipt-outline' },
            { id: 'produtos', label: 'Produtos', icon: 'pricetags-outline' },
          ].map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item.id }}
              style={[styles.tab, tab === item.id && styles.tabActive]}
              onPress={() => {
                setTab(item.id);
                if (item.id === 'pedidos') setNewAlert(false);
              }}
            >
              <Ionicons color={tab === item.id ? colors.primary : colors.surface} name={item.icon} size={17} />
              <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </GreenHeader>
      </SafeAreaView>

      {newAlert ? (
        <Pressable
          accessibilityLiveRegion="assertive"
          style={styles.alert}
          onPress={() => {
            setNewAlert(false);
            setTab('pedidos');
          }}
        >
          <Ionicons color={colors.surface} name="notifications" size={20} />
          <Text style={styles.alertText}>Novo pedido recebido! Toque para ver.</Text>
        </Pressable>
      ) : null}

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {tab === 'pedidos' ? (
          <PedidosTab busy={busy} error={error} orders={orders} onAction={changeStatus} />
        ) : (
          <ProdutosTab token={token} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerArea: {
    backgroundColor: colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  tab: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
  },
  tabText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
  },
  alert: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  alertText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    alignSelf: 'center',
    gap: 12,
    maxWidth: 640,
    padding: 16,
    width: '100%',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardNew: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNumber: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  customer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  customerText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  items: {
    backgroundColor: colors.background,
    borderRadius: 12,
    gap: 4,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemText: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 13,
  },
  amount: {
    flexShrink: 0,
  },
  totalRow: {
    borderColor: colors.border,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 6,
  },
  totalText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
  },
  formTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  productRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  productIcon: {
    height: 44,
    width: 44,
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  productMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleOn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  toggleOff: {
    backgroundColor: '#EEEEEE',
    borderColor: '#BDBDBD',
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Empresa;

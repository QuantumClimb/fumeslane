import { useState, useEffect } from 'react';
import useCartStore from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import CustomerInfoForm from '@/components/checkout/CustomerInfoForm';
import DeliveryAddressForm from '@/components/checkout/DeliveryAddressForm';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import CheckoutStepIndicator from '@/components/checkout/CheckoutStepIndicator';
import StripeCheckoutButton from '@/components/checkout/StripeCheckoutButton';
import { CustomerInfo, DeliveryAddress, PaymentMethod } from '@/types/order';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SpiceLevelDialog } from '@/components/SpiceLevelDialog';
import { RepeatCustomizationDialog } from '@/components/RepeatCustomizationDialog';
import { CartCustomization } from '@/types/cart';
import { MenuItemImage } from '@/components/MenuItemImage';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

type CheckoutStep = 'cart' | 'customer' | 'address' | 'payment' | 'stripe-payment';

// Store status type
interface StoreStatus {
  id: number;
  isOpen: boolean;
  closedMessage: string | null;
  reopenTime: string | null;
}

// Track last selected spice level for each menu item (outside component for persistence)
const lastSpiceLevels = new Map<string, number>();

export default function Checkout() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  useSEO({
    title: 'Checkout | Namaste Curry House - Complete Your Order',
    description: 'Complete your Indian food order with secure online payment. Enter delivery details and enjoy authentic Indian cuisine delivered to your door.',
    canonicalUrl: 'https://www.namastecurry.house/checkout'
  });
  
  const { 
    items, 
    total, 
    customerInfo, 
    deliveryAddress, 
    selectedPaymentMethod,
    setCustomerInfo,
    setDeliveryAddress,
    setPaymentMethod,
    addItem,
    removeItem,
    updateQuantity,
  } = useCartStore();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [isSpiceDialogOpen, setIsSpiceDialogOpen] = useState(false);
  const [isRepeatDialogOpen, setIsRepeatDialogOpen] = useState(false);
  const [currentItemForCustomization, setCurrentItemForCustomization] = useState<string | null>(null);
  
  // Store status state
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [loadingStoreStatus, setLoadingStoreStatus] = useState(true);

  // Fetch store status
  useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const response = await fetch('/api/store-status');
        if (response.ok) {
          const data = await response.json();
          setStoreStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch store status:', err);
      } finally {
        setLoadingStoreStatus(false);
      }
    };
    
    fetchStoreStatus();
  }, []);

  const isStoreClosed = storeStatus?.isOpen === false;
  
  const deliveryFee = 2.50; // Fixed for now
  const grandTotal = total + deliveryFee;
  
  const handleIncrement = (cartItemId: string, itemMenuId: string, hasSpiceCustomization: boolean) => {
    if (hasSpiceCustomization === true) {
      const lastSpiceLevel = lastSpiceLevels.get(itemMenuId);
      if (lastSpiceLevel !== undefined) {
        // Show repeat dialog
        setCurrentItemForCustomization(cartItemId);
        setIsRepeatDialogOpen(true);
      } else {
        // No previous spice level, show spice dialog
        setCurrentItemForCustomization(cartItemId);
        setIsSpiceDialogOpen(true);
      }
    } else {
      // No customization - directly increment
      const currentCartItem = items.find(ci => ci.id === cartItemId);
      if (currentCartItem) {
        updateQuantity(cartItemId, currentCartItem.quantity + 1);
      }
    }
  };

  const handleDecrement = (cartItemId: string) => {
    const currentCartItem = items.find(ci => ci.id === cartItemId);
    if (currentCartItem) {
      if (currentCartItem.quantity > 1) {
        updateQuantity(cartItemId, currentCartItem.quantity - 1);
      } else {
        // Remove item when quantity reaches 0
        removeItem(cartItemId);
      }
    }
  };

  const handleSpiceLevelConfirm = (spiceLevel: number) => {
    if (currentItemForCustomization) {
      const cartItem = items.find(ci => ci.id === currentItemForCustomization);
      if (cartItem) {
        // Store the spice level for this menu item
        lastSpiceLevels.set(cartItem.menuItem.id, spiceLevel);
        
        // Add item to cart with spice level
        const customization: CartCustomization = {
          spiceLevel
        };
        addItem(cartItem.menuItem, 1, customization);
      }
    }
    setCurrentItemForCustomization(null);
  };

  const handleRepeatCustomization = () => {
    if (currentItemForCustomization) {
      const cartItem = items.find(ci => ci.id === currentItemForCustomization);
      if (cartItem) {
        // Use the same spice level as before
        const lastSpiceLevel = lastSpiceLevels.get(cartItem.menuItem.id);
        if (lastSpiceLevel !== undefined) {
          const customization: CartCustomization = {
            spiceLevel: lastSpiceLevel
          };
          addItem(cartItem.menuItem, 1, customization);
        }
      }
    }
    setIsRepeatDialogOpen(false);
    setCurrentItemForCustomization(null);
  };

  const handleNewCustomization = () => {
    // Close repeat dialog and open spice dialog for new selection
    setIsRepeatDialogOpen(false);
    setIsSpiceDialogOpen(true);
  };
  
  const handleCustomerInfoSubmit = (info: CustomerInfo) => {
    setCustomerInfo(info);
    setCurrentStep('address');
  };
  
  const handleAddressSubmit = (address: DeliveryAddress) => {
    setDeliveryAddress(address);
    setCurrentStep('payment');
  };
  
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    
    if (method === 'whatsapp') {
      handleWhatsAppOrder();
    } else if (method === 'stripe') {
      setCurrentStep('stripe-payment');
    }
  };
  
  const handleWhatsAppOrder = () => {
    if (!customerInfo || !deliveryAddress) return;
    
    const itemList = items
      .map((item) => {
        let custom = '';
        if (item.customization) {
          const { spiceLevel, specialInstructions, extras } = item.customization;
          const parts = [];
          if (spiceLevel) parts.push(`Spice: ${spiceLevel}`);
          if (specialInstructions) parts.push(`Note: ${specialInstructions}`);
          if (extras?.length) parts.push(`Extras: ${extras.join('/')}`);
          if (parts.length) custom = ` (${parts.join(', ')})`;
        }
        return `${item.quantity} x ${item.menuItem.name}${custom}`;
      })
      .join(', ');
    
    const addressStr = `${deliveryAddress.street}${deliveryAddress.apartment ? ', ' + deliveryAddress.apartment : ''}, ${deliveryAddress.postalCode} ${deliveryAddress.city}`;
    
    const message = encodeURIComponent(
      `Hi, I would like to order:\n\n` +
      `Name: ${customerInfo.name}\n` +
      `Phone: ${customerInfo.phone}\n` +
      `Email: ${customerInfo.email}\n` +
      `Delivery Address: ${addressStr}\n\n` +
      `Order: ${itemList}\n\n` +
      `Subtotal: €${total.toFixed(2)}\n` +
      `Delivery Fee: €${deliveryFee.toFixed(2)}\n` +
      `Total: €${grandTotal.toFixed(2)}`
    );
    
    window.open(`https://wa.me/919789909362?text=${message}`, '_blank');
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t('checkout.title')}</h1>
      
      {/* Store Closed Alert */}
      {!loadingStoreStatus && isStoreClosed && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-1">{t('checkout.storeClosed')}</div>
            {storeStatus?.closedMessage && (
              <p className="text-sm mb-2">{storeStatus.closedMessage}</p>
            )}
            <p className="text-sm">
              {t('checkout.storeClosedMessage')}
            </p>
            <Button 
              onClick={() => navigate('/menu')}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              {t('checkout.returnToMenu')}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <CheckoutStepIndicator currentStep={currentStep} />
      
      {/* Cart Review */}
      {currentStep === 'cart' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('checkout.yourOrder')}</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p>{t('cart.emptyCart')}</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      {/* Menu Item Image */}
                      <MenuItemImage 
                        menuItem={item.menuItem}
                        size="medium"
                        className="rounded-md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.menuItem.name}</span>
                          {item.menuItem.hasSpiceCustomization && (
                            <span className="text-sm">🌶️</span>
                          )}
                        </div>
                        {item.customization?.spiceLevel !== undefined && (
                          <span className="text-sm text-gray-600 block mb-2">
                            {t('checkout.spiceLevel')}: {item.customization.spiceLevel}%
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <QuantityStepper
                            quantity={item.quantity}
                            onIncrement={() => handleIncrement(item.id, item.menuItem.id, item.menuItem.hasSpiceCustomization || false)}
                            onDecrement={() => handleDecrement(item.id)}
                          />
                          <span className="font-medium min-w-[60px] text-right">
                            €{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal')}:</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('cart.deliveryFee')}:</span>
                    <span>€{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('cart.total')}:</span>
                    <span>€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setCurrentStep('customer')} 
                  className="w-full mt-6"
                  size="lg"
                  disabled={isStoreClosed}
                >
                  {isStoreClosed ? t('checkout.storeClosedCheckoutDisabled') : t('checkout.continueToCustomerInfo')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Customer Info */}
      {currentStep === 'customer' && (
        <CustomerInfoForm 
          initialData={customerInfo || undefined}
          onSubmit={handleCustomerInfoSubmit}
          onBack={() => setCurrentStep('cart')}
        />
      )}
      
      {/* Delivery Address */}
      {currentStep === 'address' && (
        <DeliveryAddressForm 
          initialData={deliveryAddress || undefined}
          onSubmit={handleAddressSubmit}
          onBack={() => setCurrentStep('customer')}
        />
      )}
      
      {/* Payment Method */}
      {currentStep === 'payment' && (
        <PaymentMethodSelector 
          onSelect={handlePaymentMethodSelect}
          onBack={() => setCurrentStep('address')}
          total={grandTotal}
        />
      )}
      
      {/* Stripe Payment */}
      {currentStep === 'stripe-payment' && customerInfo && deliveryAddress && (
        <StripeCheckoutButton 
          orderItems={items}
          customerInfo={customerInfo}
          deliveryAddress={deliveryAddress}
          total={grandTotal}
          onBack={() => setCurrentStep('payment')}
        />
      )}
      
      {/* Spice Customization Dialogs */}
      {currentItemForCustomization && isSpiceDialogOpen && (() => {
        const cartItem = items.find(ci => ci.id === currentItemForCustomization);
        return (
          <SpiceLevelDialog
            open={isSpiceDialogOpen}
            onOpenChange={setIsSpiceDialogOpen}
            onConfirm={handleSpiceLevelConfirm}
            itemName={cartItem?.menuItem.name || ''}
          />
        );
      })()}
      
      {currentItemForCustomization && isRepeatDialogOpen && (() => {
        const cartItem = items.find(ci => ci.id === currentItemForCustomization);
        const lastSpiceLevel = cartItem ? lastSpiceLevels.get(cartItem.menuItem.id) : undefined;
        return (
          <RepeatCustomizationDialog
            open={isRepeatDialogOpen}
            onOpenChange={setIsRepeatDialogOpen}
            onRepeat={handleRepeatCustomization}
            onCustomize={handleNewCustomization}
            itemName={cartItem?.menuItem.name || ''}
            previousSpiceLevel={lastSpiceLevel || 0}
          />
        );
      })()}
    </div>
  );
}

import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [cart, setCart] = useState([])

    function addToCart(item) {
        setCart(prev => {
            const exists = prev.find(i => i.id === item.id)
            if (exists) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
            return [...prev, { ...item, qty: 1 }]
        })
    }

    function removeFromCart(item) {
        setCart(prev =>
            prev.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i)
                .filter(i => i.qty > 0)
        )
    }

    function clearCart() { setCart([]) }

    const cartCount = cart.reduce((s, i) => s + i.qty, 0)
    const cartTotal = cart.reduce((s, i) => s + (Number(i.price) * i.qty), 0)

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() { return useContext(CartContext) }

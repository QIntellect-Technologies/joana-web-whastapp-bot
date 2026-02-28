# Quick Testing Guide

## Test Scenarios

### Scenario 1: Pure Text Input (Natural Language)
```
1. Select language
2. Type: "2 coffees"
3. Expected: Bot acknowledges "Perfect! I found: 2x Coffee"
4. Bot then guides you through selection process
```

### Scenario 2: Quantity + Item Name
```
1. In menu, type: "add one chicken burger"
2. Expected: Bot finds "Chicken Burger" and understands qty=1
3. Bot asks for preferences
4. Item is added to cart with confirmation
```

### Scenario 3: Category Name with Quantity
```
1. In menu, type: "3 drinks"
2. Expected: Bot recognizes category "Drinks" with qty=3
3. Bot shows drink options
4. You select one drink, bot applies qty=3
5. Bot moves to next item or confirms
```

### Scenario 4: Multiple Items
```
1. Type: "2 coffees and 3 burgers"
2. Expected: Bot acknowledges "I found: 2x Coffee, 3x Burger"
3. Bot processes them one by one
4. Shows running total
```

### Scenario 5: Button Navigation + Text
```
1. Click category button "Burgers"
2. Type quantity: "5"
3. Expected: Bot shows running total
```

### Scenario 6: Help & Contextual Messages
```
1. In CATEGORIES step, type something random: "xyz"
2. Expected: Contextual help message specific to menu browsing
3. Not a generic error, but helpful guidance
```

---

## What to Look For

✅ **Bot Clarity:**
- Messages have emojis for visual clarity
- Each step is obvious and guided
- Running totals are shown

✅ **Natural Language:**
- "2 coffees" is understood
- "add one burger" works
- Typos don't break the bot

✅ **Button Support:**
- Can still use numbered selections
- Add buttons work
- Quantity buttons work

✅ **Bilingual:**
- Switch to Arabic
- Try Arabic examples: "قهوتين" (2 coffees)
- Messages are in Arabic

---

## Example Interactions

### Example 1: Natural Order
```
User: "hello"
Bot: [Language selection]

User: "English"
Bot: ✅ Great! You selected English.
     📝 You can:
     • Click buttons to browse
     • Type naturally like "2 coffees" or "add chicken burger"

User: "2 coffees"
Bot: ✅ Perfect! I found: 2x Coffee
     Let me add them to your cart...
     
Bot: Which coffee would you like?
     [Shows coffee options]

User: [Clicks Coffee option]
Bot: Adding 1x Coffee...
     🌶️ How would you like your Coffee?
     [Spicy / Non-Spicy]

User: "normal"
Bot: ✅ You want 1x Coffee
     ✅ Added to cart: 1x Coffee - 3.00 SR
     🛒 Your Cart (1 items):
     • 1x Coffee
     💰 Total: 3.00 SR
     
     Now, let's add the next item...
```

### Example 2: Traditional Button Navigation
```
User: [Selects Language]
User: [Clicks Menu]
Bot: 🍔 Choose a category or type what you want!
     [1. Burgers, 2. Wraps, 3. Sandwiches...]

User: [Clicks 1. Burgers]
Bot: Shows burger items with Add buttons

User: [Clicks Add on Chicken Burger]
Bot: 🔢 How many Chicken Burger would you like?
     [1, 2, 3, 4, Type Quantity]

User: [Clicks 2]
Bot: ✅ You want 2x Chicken Burger
     🌶️ How would you like your Chicken Burger?
     [Spicy / Non-Spicy]
```

---

## Expected Results

### ✅ When Working Correctly:
- Messages are clear and emoji-rich
- Bot acknowledges user requests
- Both buttons AND text work
- No confusing error messages
- Running totals update
- Bilingual support works

### ❌ When Something's Wrong:
- Messages are generic/unclear
- Bot doesn't understand natural language
- Input methods conflict
- No feedback during processing
- Totals don't update

---

## Browser Dev Console

If issues arise, check browser console (F12) for:
- JavaScript errors
- State updates in console logs
- Message timing issues

---

**Happy Testing! 🎉**

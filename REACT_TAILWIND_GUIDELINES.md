# React + Tailwind CSS Coding & Design Guidelines

This document serves as the mandatory technical and aesthetic reference for building React components with Tailwind CSS in this project.

---

## 1. Tech Stack & Rules

* **Framework:** Standard React (JavaScript / JSX) + Tailwind CSS.
* **No UI Libraries:** Do **NOT** use pre-built component libraries (e.g., shadcn/ui, Material UI, Ant Design, Chakra UI). Build all components using native HTML elements styled with Tailwind CSS.
* **Icons:** Use lucide-react (or standard inline SVGs).
* **Routing:** 
eact-router-dom for client-side routing.
* **State Management:** Standard React hooks (useState, useContext, useReducer) or zustand.

---

## 2. Design System & Minimal Neutral Theme

The design aesthetic must be **clean, minimal, uncluttered, and monochrome**. Use Tailwind's zinc color palette exclusively for UI layout and hierarchy.

### Color Tokens

| Role | Tailwind Classes | Description |
| :--- | :--- | :--- |
| **Page Background** | g-white or g-zinc-50 | Main canvas |
| **Container / Card** | g-white border border-zinc-200 shadow-sm | Elevates section content |
| **Primary Text** | 	ext-zinc-900 | Headings, labels, main body text |
| **Muted Text** | 	ext-zinc-500 | Subtitles, placeholders, captions |
| **Primary Action** | g-zinc-900 text-white hover:bg-zinc-800 | Primary buttons, active tabs |
| **Secondary Action** | g-zinc-100 text-zinc-900 hover:bg-zinc-200 | Cancel / secondary buttons |
| **Borders & Dividers** | order-zinc-200 or divide-zinc-200 | Subtle clean boundaries |
| **Input Fields** | g-white border-zinc-200 focus:ring-2 focus:ring-zinc-900 | Form inputs |

### Status Colors (Use Sparingly)

* **Success:** g-emerald-50 text-emerald-700 border-emerald-200
* **Warning:** g-amber-50 text-amber-700 border-amber-200
* **Error / Destructive:** g-red-50 text-red-700 border-red-200 (Destructive Button: g-red-600 hover:bg-red-700 text-white)
* **Info:** g-blue-50 text-blue-700 border-blue-200

---

## 3. Standard Component Templates

### A. Buttons

`jsx
// Primary Button
<button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2">
  Primary Action
</button>

// Secondary Button
<button className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-medium rounded-lg transition-colors border border-zinc-200">
  Secondary Action
</button>

// Ghost Button
<button className="px-4 py-2 bg-transparent hover:bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg transition-colors">
  Ghost Action
</button>

// Destructive Button
<button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
  Delete Item
</button>
`

### B. Form Inputs & Selects

`jsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-zinc-700">Email Address</label>
  <input
    type="email"
    placeholder="user@example.com"
    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
  />
</div>
`

### C. Cards & Containers

`jsx
<div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
    <h3 className="text-base font-semibold text-zinc-900">Card Header</h3>
    <span className="text-xs text-zinc-500">Updated 2m ago</span>
  </div>
  <p className="text-sm text-zinc-600">Card content goes here with clean spacing.</p>
</div>
`

### D. Minimal Data Table

`jsx
<div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
  <table className="w-full text-left border-collapse">
    <thead>
      <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
        <th className="px-6 py-3">Name</th>
        <th className="px-6 py-3">Status</th>
        <th className="px-6 py-3 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-200 text-sm text-zinc-900">
      <tr className="hover:bg-zinc-50/50 transition-colors">
        <td className="px-6 py-4 font-medium">John Doe</td>
        <td className="px-6 py-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button className="text-zinc-500 hover:text-zinc-900 font-medium">Edit</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`

### E. Modal Dialog

`jsx
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95">
      <h3 className="text-lg font-semibold text-zinc-900">Modal Title</h3>
      <p className="text-sm text-zinc-600">Detailed explanation or confirmation message.</p>
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
        <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-200">
          Cancel
        </button>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800">
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
`

---

## 4. Key Rules for Prompts & Code Generation

1. **JavaScript / JSX:** Write code in JavaScript (.jsx / .js), not TypeScript.
2. **Keep layout clean and spacious:** Use gap-4, space-y-4, p-6, and 
ounded-xl for modern spacing.
3. **Never add arbitrary vibrant colors:** Avoid saturated blue, purple, gradient headers, or flashy backgrounds unless requested. Stick to zinc-900, zinc-500, and zinc-200.
4. **Accessibility:** Always include ocus:outline-none focus:ring-2 focus:ring-zinc-900 on form inputs and interactive buttons.
5. **Self-contained components:** Keep logic straightforward and clean using standard React hooks.
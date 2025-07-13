# StackMotive API Response Contract

## 📋 LOCKED RESPONSE SHAPES

### ✅ Holdings Endpoints:
```typescript
GET /api/holdings → Holding[]
GET /api/user/paper-trading-account/{id}/holdings → Holding[]
```

**MUST RETURN:**
```typescript
interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}
```

**❌ NEVER RETURN:**
```typescript
{ holdings: Holding[] }  // ❌ WRAPPED - FORBIDDEN
{ data: Holding[] }      // ❌ WRAPPED - FORBIDDEN
```

### ✅ All Array Endpoints:
- Always return arrays directly, never wrapped in objects
- Consistent camelCase field naming
- No null/undefined values (use empty arrays)

### ✅ Contract Verification:
- Last verified: 2025-05-29
- All holdings endpoints confirmed to return `Holding[]`
- No wrapped responses found in codebase

### 🔒 Lock Status:
**FROZEN** - No changes to response shapes without explicit approval

### ⚠️ Important:
Any changes to these contracts require:
1. Frontend type updates in `/types/holdings.ts`
2. Backend schema updates
3. Full integration testing
4. Migration plan for existing consumers 
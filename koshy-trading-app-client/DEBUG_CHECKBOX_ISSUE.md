# Debugging Checkbox Issue - Information Needed

## What I Need From You:

### Step 1: Test Condition 1 Checkbox
1. **Open the browser console** (F12 → Console tab)
2. **Edit CNTest condition**
3. **Click the "Enable this condition" checkbox** (Condition 1)
4. **Tell me:**
   - Does the checkbox visually toggle (check/uncheck)?
   - Do you see ANY console logs? (Look for `[Condition1 Checkbox]` or `[Checkbox]`)
   - If yes, what do the logs say?

### Step 2: Test Save Process
1. **Enable Condition 1 checkbox** (make sure it's checked)
2. **Enable LRC Filter checkbox** (make sure it's checked)
3. **Click Save**
4. **Before clicking Save, check console for:**
   - `Form state before save:` - What does it show for `condition1_enabled`?
5. **After Save, check server console for:**
   - `[updateCondition] UPDATE values:` - What does it show for `condition1`?

### Step 3: Test Loading After Save
1. **After saving, click Edit on CNTest again**
2. **Check browser console for:**
   - `Fetched condition data:` - What does it show for `condition1_enabled`?
3. **Check server console for:**
   - `[fetchConditionById] Returning condition data:` - What does it show for `condition1_enabled`?

### Step 4: Direct Database Check
Run this SQL query and tell me what `condition1` value is:
```sql
SELECT id, name, condition1, condition2, lrc_filter_enabled, lrc_filter_type 
FROM conditions 
WHERE name = 'CN-Test' OR id = 6;
```

## What I Suspect:

Based on your description, I think:
1. The checkbox might be working visually but not updating React state
2. OR the state is being reset when you click LRC checkbox
3. OR the save is overwriting condition1/condition2 with false values

The logs will tell us exactly where the issue is.

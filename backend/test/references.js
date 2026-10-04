// Known-good solutions for every seeded problem, in every supported language.
// The test suite runs them through the real executor against the seed's test
// cases, so a typo in a test case, signature or harness fails CI.
module.exports = {
  "two-sum": {
    javascript: `function solve(nums, target) { const m = new Map(); for (let i = 0; i < nums.length; i++) { const j = m.get(target - nums[i]); if (j !== undefined) return [j, i]; m.set(nums[i], i); } return []; }`,
    python: `def solve(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []`,
    cpp: `vector<int> solve(vector<int>& nums, int target) { unordered_map<int,int> m; for (int i = 0; i < (int)nums.size(); i++) { auto it = m.find(target - nums[i]); if (it != m.end()) return {it->second, i}; m[nums[i]] = i; } return {}; }`,
  },
  "valid-parentheses": {
    javascript: `function solve(s) { const st = []; const p = { ")": "(", "]": "[", "}": "{" }; for (const c of s) { if (c in p) { if (st.pop() !== p[c]) return false; } else st.push(c); } return st.length === 0; }`,
    python: `def solve(s):\n    st = []\n    p = {')': '(', ']': '[', '}': '{'}\n    for c in s:\n        if c in p:\n            if not st or st.pop() != p[c]:\n                return False\n        else:\n            st.append(c)\n    return not st`,
    cpp: `bool solve(string s) { vector<char> st; for (char c : s) { if (c == ')' || c == ']' || c == '}') { if (st.empty()) return false; char o = st.back(); st.pop_back(); if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) return false; } else st.push_back(c); } return st.empty(); }`,
  },
  "maximum-subarray": {
    javascript: `function solve(a) { let best = a[0], cur = a[0]; for (let i = 1; i < a.length; i++) { cur = Math.max(a[i], cur + a[i]); best = Math.max(best, cur); } return best; }`,
    python: `def solve(a):\n    best = cur = a[0]\n    for x in a[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best`,
    cpp: `int solve(vector<int>& a) { int best = a[0], cur = a[0]; for (size_t i = 1; i < a.size(); i++) { cur = max(a[i], cur + a[i]); best = max(best, cur); } return best; }`,
  },
  "best-time-to-buy-and-sell-stock": {
    javascript: `function solve(p) { let mn = Infinity, best = 0; for (const x of p) { mn = Math.min(mn, x); best = Math.max(best, x - mn); } return best; }`,
    python: `def solve(p):\n    mn, best = float('inf'), 0\n    for x in p:\n        mn = min(mn, x)\n        best = max(best, x - mn)\n    return best`,
    cpp: `int solve(vector<int>& p) { int mn = INT_MAX, best = 0; for (int x : p) { mn = min(mn, x); best = max(best, x - mn); } return best; }`,
  },
  "contains-duplicate": {
    javascript: `function solve(a) { return new Set(a).size !== a.length; }`,
    python: `def solve(a):\n    return len(set(a)) != len(a)`,
    cpp: `bool solve(vector<int>& a) { return set<int>(a.begin(), a.end()).size() != a.size(); }`,
  },
  "binary-search": {
    javascript: `function solve(a, t) { let l = 0, r = a.length - 1; while (l <= r) { const m = (l + r) >> 1; if (a[m] === t) return m; if (a[m] < t) l = m + 1; else r = m - 1; } return -1; }`,
    python: `def solve(a, t):\n    l, r = 0, len(a) - 1\n    while l <= r:\n        m = (l + r) // 2\n        if a[m] == t:\n            return m\n        if a[m] < t:\n            l = m + 1\n        else:\n            r = m - 1\n    return -1`,
    cpp: `int solve(vector<int>& a, int t) { int l = 0, r = (int)a.size() - 1; while (l <= r) { int m = l + (r - l) / 2; if (a[m] == t) return m; if (a[m] < t) l = m + 1; else r = m - 1; } return -1; }`,
  },
  // In-place problem: nothing is returned, the mutated argument is graded.
  "move-zeroes": {
    javascript: `function solve(nums) { let k = 0; for (let i = 0; i < nums.length; i++) { if (nums[i] !== 0) { const t = nums[k]; nums[k] = nums[i]; nums[i] = t; k++; } } }`,
    python: `def solve(nums):\n    k = 0\n    for i in range(len(nums)):\n        if nums[i] != 0:\n            nums[k], nums[i] = nums[i], nums[k]\n            k += 1`,
    cpp: `void solve(vector<int>& nums) { int k = 0; for (size_t i = 0; i < nums.size(); i++) if (nums[i] != 0) swap(nums[k++], nums[i]); }`,
  },
  "valid-palindrome": {
    javascript: `function solve(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return t === t.split("").reverse().join(""); }`,
    python: `def solve(s):\n    t = [c.lower() for c in s if c.isalnum()]\n    return t == t[::-1]`,
    cpp: `bool solve(string s) { string t; for (char c : s) if (isalnum((unsigned char)c)) t += tolower((unsigned char)c); return t == string(t.rbegin(), t.rend()); }`,
  },
  "longest-substring-without-repeating-characters": {
    javascript: `function solve(s) { const last = new Map(); let best = 0, l = 0; for (let r = 0; r < s.length; r++) { if (last.has(s[r]) && last.get(s[r]) >= l) l = last.get(s[r]) + 1; last.set(s[r], r); best = Math.max(best, r - l + 1); } return best; }`,
    python: `def solve(s):\n    last, best, l = {}, 0, 0\n    for r, c in enumerate(s):\n        if c in last and last[c] >= l:\n            l = last[c] + 1\n        last[c] = r\n        best = max(best, r - l + 1)\n    return best`,
    cpp: `int solve(string s) { unordered_map<char,int> last; int best = 0, l = 0; for (int r = 0; r < (int)s.size(); r++) { auto it = last.find(s[r]); if (it != last.end() && it->second >= l) l = it->second + 1; last[s[r]] = r; best = max(best, r - l + 1); } return best; }`,
  },
  "product-of-array-except-self": {
    javascript: `function solve(a) { const n = a.length, r = new Array(n).fill(1); let p = 1; for (let i = 0; i < n; i++) { r[i] = p; p *= a[i]; } p = 1; for (let i = n - 1; i >= 0; i--) { r[i] *= p; p *= a[i]; } return r; }`,
    python: `def solve(a):\n    n = len(a)\n    r = [1] * n\n    p = 1\n    for i in range(n):\n        r[i] = p\n        p *= a[i]\n    p = 1\n    for i in range(n - 1, -1, -1):\n        r[i] *= p\n        p *= a[i]\n    return r`,
    cpp: `vector<int> solve(vector<int>& a) { int n = a.size(); vector<int> r(n, 1); int p = 1; for (int i = 0; i < n; i++) { r[i] = p; p *= a[i]; } p = 1; for (int i = n - 1; i >= 0; i--) { r[i] *= p; p *= a[i]; } return r; }`,
  },
  "climbing-stairs": {
    javascript: `function solve(n) { let a = 1, b = 1; for (let i = 2; i <= n; i++) [a, b] = [b, a + b]; return b; }`,
    python: `def solve(n):\n    a, b = 1, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b`,
    cpp: `int solve(int n) { int a = 1, b = 1; for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; } return b; }`,
  },
  "house-robber": {
    javascript: `function solve(nums) { let a = 0, b = 0; for (const x of nums) [a, b] = [b, Math.max(b, a + x)]; return b; }`,
    python: `def solve(nums):\n    a = b = 0\n    for x in nums:\n        a, b = b, max(b, a + x)\n    return b`,
    cpp: `int solve(vector<int>& nums) { int a = 0, b = 0; for (int x : nums) { int c = max(b, a + x); a = b; b = c; } return b; }`,
  },
  "merge-intervals": {
    javascript: `function solve(iv) { iv.sort((a, b) => a[0] - b[0]); const r = []; for (const x of iv) { if (!r.length || r[r.length - 1][1] < x[0]) r.push([x[0], x[1]]); else r[r.length - 1][1] = Math.max(r[r.length - 1][1], x[1]); } return r; }`,
    python: `def solve(iv):\n    iv.sort()\n    r = []\n    for a, b in iv:\n        if not r or r[-1][1] < a:\n            r.append([a, b])\n        else:\n            r[-1][1] = max(r[-1][1], b)\n    return r`,
    cpp: `vector<vector<int>> solve(vector<vector<int>>& v) { sort(v.begin(), v.end()); vector<vector<int>> r; for (auto& x : v) { if (r.empty() || r.back()[1] < x[0]) r.push_back(x); else r.back()[1] = max(r.back()[1], x[1]); } return r; }`,
  },
};

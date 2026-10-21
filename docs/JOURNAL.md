# DSA Technical Journal: Python-Based Garden Simulator (v0.7.0)

## 1. Project Overview
GardenSim is a browser-based garden simulation project developed for our Data Structures and Algorithms subject. The project allows users to interact with a virtual garden while demonstrating different data structures using Python. The project uses HTML, CSS, JavaScript, and Python integration. The main goal of this project is to apply the concepts of Python OOP, 2D list, Stack, Queue, Hierarchical (binary) Tree, Tree Traversal (BFS, DFS Preorder / Inorder / Postorder) and the Binary Search Tree (BST). 

## 2. Current Project Progress
| Requirement | Project Implementation | Current Status | Purpose |
|---|---|---|---|
| Python OOP | `Crop`, `ResourceStorage`, `Plant`, `GardenGrid`, `TreeNode`, `BinaryTree`, `GardenTree` (inheritance), `BSTNode`, `BST` | Implemented | Group data and behavior of each game object |
| 2D List / Array | `GardenGrid.cells[row][col]` (5x5) | Implemented | Garden plots for planting and harvesting |
| Stack | `ActionHistoryStack` | Implemented | Undo the most recent planting (LIFO) |
| Queue | `ClimateQueue` (deque) | Implemented | Climate events happen in arrival order (FIFO) |
| Hierarchical Tree | `TreeNode`, `BinaryTree`, `GardenTree` (root Garden) | Implemented | Show how plants are organized in a hierarchy |
| BFS | `bfs(root)` with a queue | Implemented | Visit plants level by level |
| DFS (Preorder, Inorder, Postorder) | `preorder`, `inorder`, `postorder` + `dfs_stack` | Implemented | Visit plants subtree by subtree |
| Binary Search Tree | `BST` with `insert`, `search`, `delete` (3 cases) | Implemented (new in v0.7.0) | Find, add and remove plants by tile number quickly |

## 3. Implemented Data Structures

### 3.1 Python OOP
Every game object is a class with its own data and methods. `ResourceStorage` owns water, seeds, energy, hope and coins. `Plant` knows its age and growth stage. `GardenGrid`, `ActionHistoryStack`, `ClimateQueue`, `BinaryTree` and `BST` each do one job. `GardenTree` **inherits** from `BinaryTree`, so it reuses its code. OOP is appropriate because every part of the garden has its own state and rules.

**Code: `ResourceStorage` class (Topic 1)** (`js/templates.js`, lines 10-23)

```python
  10  class ResourceStorage:
  11      MAX = {"water": 200, "seeds": 100, "energy": 120, "hope": 100}
  12      def __init__(self):
  13          self.water, self.seeds, self.energy = 200, 90, 110
  14          self.hope, self.coins = 65, 120
  15      def can_afford(self, coins=0, water=0, seeds=0):
  16          return self.coins >= coins and self.water >= water and self.seeds >= seeds
  17      def change(self, **delta):              # e.g. change(coins=-10, water=-5)
  18          for k, v in delta.items():
  19              val = getattr(self, k) + v
  20              setattr(self, k, max(0, min(val, self.MAX.get(k, 9999))))
  21          self.sync()
  22      def sync(self):
  23          updateResources(json.dumps(vars(self)))
```

Key lines to explain:

| Line | What it does |
|---|---|
| 10 | A class: one object that keeps all garden resources (data and behavior together = OOP). |
| 12 | Constructor. Sets the starting attributes (water, seeds, energy, hope, coins). |
| 15 | Method that checks resources BEFORE an action. `plant_at` calls it. |
| 17 | The only place where resources change, so the rules live in one spot. |
| 20 | Updates the attribute by name and keeps it between 0 and its MAX. |

### 3.2 2D List / Array
The garden is `cells = [[None for _ in range(5)] for _ in range(5)]`. The first index is the row (vertical), the second is the column (horizontal). Example concept: `cells[row][column]`. A list comprehension is used so every row is a separate list (the shortcut `[[None]*5]*5` would make 5 copies of the same row).

**Code: `GardenGrid` class (Topic 4)** (`js/templates.js`, lines 114-130)

```python
 114  class GardenGrid:
 115      def __init__(self, rows=5, cols=5):
 116          # 2D list: cells[row][col]. NOT [[None]*cols]*rows (shared rows!)
 117          self.cells = [[None for _ in range(cols)] for _ in range(rows)]
 118      def is_empty(self, r, c): return self.cells[r][c] is None   # O(1)
 119      def place(self, r, c, plant): self.cells[r][c] = plant      # O(1)
 120      def remove(self, r, c):
 121          p = self.cells[r][c]; self.cells[r][c] = None; return p
 122      def grow_all(self):                      # O(rows * cols)
 123          for row in self.cells:
 124              for p in row:
 125                  if p: p.age += 1
 126      def count(self):
 127          return sum(1 for row in self.cells for p in row if p)
 128      def sync(self):
 129          setGrid(json.dumps([[{"e": p.stage(), "ripe": p.ripe()} if p else None
 130                               for p in row] for row in self.cells]))
```

Key lines to explain:

| Line | What it does |
|---|---|
| 117 | THE 2D LIST: a list of rows. Comprehension makes a NEW list for each row (never `[[None]*5]*5`). |
| 118 | `cells[r][c]` = direct index, O(1). r = row, c = column. |
| 119 | Put a plant in one cell. |
| 123 | Nested loops visit every tile: O(rows x cols). |

**Code: `plant_at()` uses grid, stack, tree and BST together (Topic 4)** (`js/templates.js`, lines 134-148)

```python
 134  def plant_at(r, c, name):
 135      crop = next((x for x in CROPS if x.name == name), None)
 136      if crop is None: return "Choose a seed first."
 137      if not grid.is_empty(r, c): return "Tile (%d,%d) is occupied." % (r, c)
 138      if not resources.can_afford(coins=crop.cost, seeds=1, water=5):
 139          return "Not enough coins, seeds or water."
 140      grid.place(r, c, Plant(crop))
 141      resources.change(coins=-crop.cost, seeds=-1, water=-5)
 142      if "tree" in globals(): tree.add_plant(crop, r, c)
 143      if "bst" in globals(): bst.insert(r * 5 + c, "%s(%d,%d)" % (crop.name, r, c), crop.category)
 144      if "history" in globals():
 145          history.push({"row": r, "col": c, "cost": crop.cost,
 146                        "label": "Planted %s at (%d,%d)" % (crop.name, r, c)})
 147      refresh()
 148      return "Planted " + crop.name
```

Key lines to explain:

| Line | What it does |
|---|---|
| 140 | 2D list: store the plant at [row][col]. |
| 142 | Hierarchical tree: add a node. |
| 143 | BST: insert key = row*5 + col. |
| 145 | Stack: remember the action so it can be undone. |

### 3.3 Stack
LIFO (Last In, First Out). Every planting is pushed on the stack. The **Undo (Pop)** button pops the newest action and reverses it (removes the plant, refunds coins, seed and water). Interface: the Action History panel shows `TOP` and the Undo button.

**Code: `ActionHistoryStack` class (Topic 2)** (`js/templates.js`, lines 36-49)

```python
  36  class ActionHistoryStack:
  37      def __init__(self):
  38          self.items = []                      # top of stack = last element
  39      def push(self, action):                  # O(1)
  40          self.items.append(action); self.sync()
  41      def pop(self):                           # O(1)
  42          item = self.items.pop() if self.items else None
  43          self.sync(); return item
  44      def peek(self):
  45          return self.items[-1] if self.items else None
  46      def is_empty(self):
  47          return len(self.items) == 0
  48      def sync(self):
  49          setStack(json.dumps(self.items))
```

Key lines to explain:

| Line | What it does |
|---|---|
| 38 | A Python list holds the stack. The END of the list is the TOP. |
| 40 | push: add on top. O(1). |
| 42 | pop: remove the newest item. O(1). |
| 44 | peek: look at the top without removing it. |

**Code: `undo_last()` uses the stack (Topic 2)** (`js/templates.js`, lines 54-66)

```python
  54  def undo_last():
  55      a = history.pop()                        # LIFO: newest action first
  56      if a is None:
  57          return "Stack is empty."
  58      r, c = a["row"], a["col"]
  59      if grid.cells[r][c] is None:
  60          return "Nothing to undo there (already harvested)."
  61      grid.remove(r, c)
  62      tree.remove_plant(r, c)
  63      if "bst" in globals(): bst.delete(r * 5 + c)      # keep BST in sync
  64      resources.change(coins=a["cost"], seeds=1, water=5)
  65      refresh()
  66      return "Undid: " + a["label"]
```

Key lines to explain:

| Line | What it does |
|---|---|
| 55 | LIFO: the LAST planting is undone FIRST. |
| 61 | Reverses the planting on the 2D list. |
| 62 | Removes the node from the hierarchical tree. |
| 63 | Removes the key from the Binary Search Tree. |

The **push** happens in `plant_at` (Topic 4, line 145): `history.push({...})`.

### 3.4 Queue
FIFO (First In, First Out). Climate events wait in a queue. **Next Day (Dequeue)** removes the oldest event from the front, applies its effect and adds a new random event at the back. Built on `collections.deque` because `list.pop(0)` is O(n) but `deque.popleft()` is O(1). Interface: the Climate Queue panel marks the front as "Next out".

**Code: `ClimateQueue` class (Topic 3)** (`js/templates.js`, lines 72-81)

```python
  72  class ClimateQueue:
  73      def __init__(self):
  74          self.items = deque(["Rain", "Drought", "Heatwave"])
  75      def enqueue(self, event):                # O(1)
  76          self.items.append(event); self.sync()
  77      def dequeue(self):                       # O(1)
  78          e = self.items.popleft() if self.items else None
  79          self.sync(); return e
  80      def sync(self):
  81          setQueue(json.dumps(list(self.items)))
```

Key lines to explain:

| Line | What it does |
|---|---|
| 74 | `deque` = double-ended queue. Fast at both ends. |
| 76 | enqueue: add to the BACK. O(1). |
| 78 | dequeue: remove from the FRONT. O(1). |

**Code: `next_day()` uses the queue (Topic 3)** (`js/templates.js`, lines 90-100)

```python
  90  def next_day():
  91      global day
  92      day += 1
  93      event = climate.dequeue()                # FIFO: oldest event happens first
  94      resources.change(coins=5, **EFFECTS.get(event, {}))
  95      climate.enqueue(random.choice(list(EFFECTS)))
  96      if "grid" in globals():
  97          grid.grow_all()
  98          refresh()
  99      setDay(day)
 100      return "Day %d: %s hit the garden." % (day, event)
```

Key lines to explain:

| Line | What it does |
|---|---|
| 93 | FIFO: the OLDEST event happens first. |
| 94 | Applies the event effect to the resources. |
| 95 | A new random event joins the back of the line. |
| 97 | Every plant grows one day (loop over the 2D list). |

### 3.5 Hierarchical Tree
Every planted crop becomes a node in a binary tree. The root is Garden (tree icon). Terms: **root** (top node), **branch** (has a parent and children), **parent / child**, **siblings** (same parent), **leaf** (no children), **subtree**, **size** (number of nodes), **depth** (steps from the root) and **height** (longest path down to a leaf). The page draws it with circles and lines.

Lesson example used for testing (`Lesson Example A-F` button):
```
        A            root
      /   \
     B     C         branches
    / \     \
   D   E     F       leaves
```
A has depth 0 and height 2. D, E and F are leaves (height 0).

**Code: `TreeNode` and `BinaryTree` (Topic 5)** (`js/templates.js`, lines 172-216)

```python
 172  class TreeNode:
 173      _next_id = 0
 174      def __init__(self, name, label=None, pos=None, cat="Garden"):
 175          TreeNode._next_id += 1
 176          self.id = TreeNode._next_id
 177          self.name, self.label, self.pos, self.cat = name, label or name, pos, cat
 178          self.parent = self.left = self.right = None
 179      def depth(self):                         # root = 0
 180          return 0 if self.parent is None else 1 + self.parent.depth()
 181      def height(self):                        # leaf = 0, O(n)
 182          l = self.left.height() if self.left else -1
 183          r = self.right.height() if self.right else -1
 184          return 1 + max(l, r)
 185      def size(self):                          # O(n)
 186          return 1 + (self.left.size() if self.left else 0) + (self.right.size() if self.right else 0)
 187      def to_dict(self):
 188          return {"id": self.id, "label": self.label, "name": self.name, "cat": self.cat,
 189                  "left": self.left.to_dict() if self.left else None,
 190                  "right": self.right.to_dict() if self.right else None}
 191  
 192  class BinaryTree:
 193      def __init__(self, root):
 194          self.root = root
 195      def _level_list(self):                   # nodes top-to-bottom, left-to-right
 196          out, q = [], deque([self.root])
 197          while q:
 198              n = q.popleft(); out.append(n)
 199              if n.left: q.append(n.left)
 200              if n.right: q.append(n.right)
 201          return out
 202      def insert(self, node):                  # first free slot, O(n)
 203          for cur in self._level_list():
 204              if cur.left is None:  cur.left = node;  node.parent = cur; return
 205              if cur.right is None: cur.right = node; node.parent = cur; return
 206      def remove_pos(self, pos):               # O(n): last node fills the gap
 207          nodes = self._level_list()
 208          target = next((n for n in nodes if n.pos == pos), None)
 209          if target is None: return
 210          last = nodes[-1]
 211          if target is not last:
 212              target.name, target.label, target.pos, target.cat = last.name, last.label, last.pos, last.cat
 213          p = last.parent
 214          if p.right is last: p.right = None
 215          else: p.left = None
 216          last.parent = None
```

Key lines to explain:

| Line | What it does |
|---|---|
| 178 | Each node knows its PARENT and its two CHILDREN (left, right). A node with no children is a LEAF. |
| 179 | Depth = steps from the root (root = 0). Recursion goes up through parents. |
| 181 | Height = longest path down to a leaf (leaf = 0). O(n). |
| 185 | Size = number of nodes. O(n). |
| 195 | Uses a queue to list nodes level by level (BFS). |
| 202 | Puts the new node in the FIRST free slot, so the tree stays compact. O(n). |
| 204 | Free left slot? attach here. Otherwise check the right slot. |
| 206 | Harvest/undo: the LAST node moves into the gap so no hole is left. O(n). |

**Code: `GardenTree` (Topic 5)** (`js/templates.js`, lines 226-233)

```python
 226  class GardenTree(BinaryTree):
 227      """Root = Garden. Every planted crop becomes a node (left/right children)."""
 228      def __init__(self):
 229          super().__init__(TreeNode("Garden", "🌳"))
 230      def add_plant(self, crop, r, c):
 231          self.insert(TreeNode("%s(%d,%d)" % (crop.name, r, c), crop.emoji, (r, c), crop.category))
 232      def remove_plant(self, r, c):
 233          self.remove_pos((r, c))
```

Key lines to explain:

| Line | What it does |
|---|---|
| 226 | Inheritance: GardenTree reuses everything from BinaryTree. |
| 229 | The root of the garden tree is the node Garden. |
| 230 | Every planted crop becomes a new node. |
| 232 | Every harvested/undone crop removes its node. |

### 3.6 Tree Traversal (BFS and DFS)
Traversal means visiting every node exactly once.

| Traversal | Order | Data structure | Result on A-F example |
|---|---|---|---|
| BFS (level order) | level by level, left to right | Queue (FIFO) | A B C D E F |
| DFS Preorder | Root, Left, Right | recursion (call stack) or explicit Stack | A B D E C F |
| DFS Inorder | Left, Root, Right | recursion | D B E A C F |
| DFS Postorder | Left, Right, Root | recursion | D E B F C A |

The four buttons animate the visiting order with numbers. On the lesson example the page also checks the answer against the expected result.

**Code: BFS and DFS traversals (Topic 6)** (`js/templates.js`, lines 243-275)

```python
 243  def bfs(root):                               # Level order, uses a QUEUE, O(n)
 244      out, q = [], deque([root])
 245      while q:
 246          n = q.popleft(); out.append(n)
 247          if n.left:  q.append(n.left)
 248          if n.right: q.append(n.right)
 249      return out
 250  
 251  def preorder(n, out=None):                   # Root -> Left -> Right
 252      out = [] if out is None else out
 253      if n:
 254          out.append(n); preorder(n.left, out); preorder(n.right, out)
 255      return out
 256  
 257  def inorder(n, out=None):                    # Left -> Root -> Right
 258      out = [] if out is None else out
 259      if n:
 260          inorder(n.left, out); out.append(n); inorder(n.right, out)
 261      return out
 262  
 263  def postorder(n, out=None):                  # Left -> Right -> Root
 264      out = [] if out is None else out
 265      if n:
 266          postorder(n.left, out); postorder(n.right, out); out.append(n)
 267      return out
 268  
 269  def dfs_stack(root):                         # iterative DFS with an explicit STACK
 270      out, st = [], [root]
 271      while st:
 272          n = st.pop(); out.append(n)
 273          if n.right: st.append(n.right)       # push right first -> left pops first
 274          if n.left:  st.append(n.left)
 275      return out
```

Key lines to explain:

| Line | What it does |
|---|---|
| 244 | BFS uses a QUEUE (FIFO). |
| 246 | Take the node at the FRONT of the queue. |
| 247 | Children go to the BACK, so the next level waits its turn. |
| 251 | DFS Preorder: Root, Left, Right. |
| 254 | Visit the root FIRST, then recurse left, then right. |
| 257 | DFS Inorder: Left, Root, Right. |
| 260 | Go left first, visit the root in the middle, then right. |
| 263 | DFS Postorder: Left, Right, Root. |
| 266 | Visit the root LAST (children before parent). |
| 272 | Iterative DFS: an explicit STACK (LIFO) replaces the recursion call stack. |

### 3.7 Binary Search Tree (BST)
A BST is a binary tree with one extra rule: **every key in the left subtree is smaller than the node, and every key in the right subtree is bigger**. In the game, the key of a plant is its tile number: `key = row * 5 + col` (tile row 1, column 2 has key 7). With this rule, search does not need to look at every plant. It compares once per level and throws away half of the tree.

Demo tree used for practice (keys inserted in this order: 50, 30, 70, 20, 40, 60, 80):
```
          50
        /    \
      30      70
     /  \    /  \
   20   40  60   80
```
Inorder gives 20 30 40 50 60 70 80, which is **sorted**. That is the main property of a BST.

Delete has three cases (tested in section 5):
1. **Leaf** (no children): just remove it. Example: delete 20.
2. **One child**: replace the node by its child. Example: delete 30 (child 40 takes its place).
3. **Two children**: copy the **inorder successor** (smallest key in the right subtree) into the node, then delete the successor. Example: delete 50 (root). The successor is 60, so 60 becomes the new root.

**Code: `BST` class: insert, search, delete (Topic 7)** (`js/templates.js`, lines 309-366)

```python
 309  class BST:
 310      """Binary Search Tree rule: left keys < node key < right keys. No duplicates."""
 311      def __init__(self):
 312          self.root = None
 313  
 314      def insert(self, key, name=None, cat="Garden"):      # avg O(log n), worst O(n)
 315          new = BSTNode(key, name, cat)
 316          if self.root is None:
 317              self.root = new
 318              return True
 319          cur = self.root
 320          while True:
 321              if key == cur.key:
 322                  return False                             # duplicate key -> reject
 323              if key < cur.key:                            # smaller -> go left
 324                  if cur.left is None:
 325                      cur.left = new
 326                      return True
 327                  cur = cur.left
 328              else:                                        # bigger -> go right
 329                  if cur.right is None:
 330                      cur.right = new
 331                      return True
 332                  cur = cur.right
 333  
 334      def search(self, key):                               # avg O(log n), worst O(n)
 335          path, cur = [], self.root
 336          while cur:
 337              path.append(cur.id)                          # remember every step
 338              if key == cur.key:
 339                  return cur, path
 340              cur = cur.left if key < cur.key else cur.right
 341          return None, path
 342  
 343      def delete(self, key):                               # avg O(log n), worst O(n)
 344          self.root, deleted = self._delete(self.root, key)
 345          return deleted
 346  
 347      def _delete(self, node, key):
 348          if node is None:
 349              return None, False                           # key not in tree
 350          if key < node.key:
 351              node.left, done = self._delete(node.left, key)
 352              return node, done
 353          if key > node.key:
 354              node.right, done = self._delete(node.right, key)
 355              return node, done
 356          # --- found the node to delete ---
 357          if node.left is None:                            # case 1 (leaf) and case 2 (one child)
 358              return node.right, True
 359          if node.right is None:                           # case 2 (one child)
 360              return node.left, True
 361          succ = node.right                                # case 3 (two children):
 362          while succ.left:                                 # inorder successor = smallest key
 363              succ = succ.left                             # in the right subtree
 364          node.key, node.name, node.cat = succ.key, succ.name, succ.cat   # node mutation
 365          node.right, _ = self._delete(node.right, succ.key)              # remove the copy
 366          return node, True
```

Key lines to explain:

| Line | What it does |
|---|---|
| 309 | Rule: LEFT keys < node key < RIGHT keys. Because of this rule we can skip half of the tree at every step. |
| 314 | Insert: start at the root and walk down. Average O(log n), worst O(n). |
| 321 | No duplicate keys: one plant per tile. |
| 323 | Smaller key? go LEFT. Otherwise go RIGHT. |
| 325 | Found an empty spot: attach the new node as a leaf. |
| 334 | Search: same walk as insert. Average O(log n). |
| 337 | Remembers every step so the page can animate the path and count comparisons. |
| 340 | The binary decision: one comparison removes half of the remaining tree. |
| 347 | Delete (recursive helper) returns the new root of each subtree. |
| 357 | Case 1 (leaf) and Case 2 (one child): replace the node by its child. |
| 361 | Case 3 (two children): find the INORDER SUCCESSOR = smallest key in the right subtree. |
| 362 | Keep going left to reach that smallest key. |
| 364 | NODE MUTATION: copy the successor's data into the node being deleted. |
| 365 | Then delete the duplicate successor node (it has at most one child). |

**Code: BST traversals (Topic 7)** (`js/templates.js`, lines 369-383)

```python
 369  def bst_inorder(n, out=None):                            # Left, Root, Right -> SORTED keys
 370      out = [] if out is None else out
 371      if n:
 372          bst_inorder(n.left, out); out.append(n); bst_inorder(n.right, out)
 373      return out
 374  def bst_preorder(n, out=None):                           # Root, Left, Right
 375      out = [] if out is None else out
 376      if n:
 377          out.append(n); bst_preorder(n.left, out); bst_preorder(n.right, out)
 378      return out
 379  def bst_postorder(n, out=None):                          # Left, Right, Root
 380      out = [] if out is None else out
 381      if n:
 382          bst_postorder(n.left, out); bst_postorder(n.right, out); out.append(n)
 383      return out
```

Key lines to explain:

| Line | What it does |
|---|---|
| 369 | Inorder on a BST returns the keys in ASCENDING (sorted) order. |
| 374 | Preorder: Root, Left, Right (good for copying a tree). |
| 379 | Postorder: Left, Right, Root (good for deleting a tree). |

Hooks that keep the BST in sync with the game: `bst.insert` in `plant_at` (line 143), `bst.delete` in `harvest_at` (line 155) and in `undo_last` (line 63).

## 4. Complexity Summary
n = number of nodes, h = height of the tree, w = widest level.

| Structure / Operation | Complexity | Reason |
|---|---|---|
| Grid access `cells[r][c]` | O(1) | Direct indexes |
| Grid `grow_all` / `count` | O(rows x cols) | Visits every cell |
| Stack push / pop / peek | O(1) | Works at the end of a list |
| Queue enqueue / dequeue | O(1) | `deque` is fast at both ends |
| Binary tree insert (first free slot) | O(n) | BFS to find the slot |
| Binary tree remove | O(n) | BFS list to find the node and the last node |
| `height()` / `size()` | O(n) | Visits the whole subtree |
| BFS | O(n) time, O(w) space | Each node once; queue holds one level |
| DFS Preorder / Inorder / Postorder | O(n) time, O(h) space | Each node once; recursion depth = height |
| BST insert / search / delete | O(log n) average, O(n) worst | One comparison per level; worst case is a skewed tree where h = n |
| BST traversal | O(n) | Each node once |

Why the BST worst case is O(n): if keys are inserted in sorted order (1, 2, 3, 4, 5) every node goes to the right, the tree becomes a "linked list" and its height is n - 1. Balanced trees (AVL, Red-Black) fix this but are not part of this version.

## 5. Testing and Demonstration
Method: run **Run All 1-7**, then test each feature in the interface.
- Plant on empty tiles: resources drop, the stack, hierarchical tree and BST all update.
- Plant on an occupied tile or without resources: a message is shown and nothing changes.
- Undo repeatedly until "Stack is empty."
- Next Day x3: events leave the queue in the order Rain, Drought, Heatwave (FIFO).
- Ripe crops glow; harvest gives coins and hope and removes the plant from the tree and BST.
- Hierarchical tree: BFS, Preorder, Inorder, Postorder buttons animate the order. `Lesson Example A-F` shows all four matching the lesson (A B C D E F / A B D E C F / D B E A C F / D E B F C A).
- BST **Demo tree**, Inorder: 20 30 40 50 60 70 80 and the message "Inorder gives the keys in ascending (sorted) order".
- BST Search 60 on the demo tree: path 50, 70, 60 (3 comparisons). Search 65: not found.
- BST Insert 65, then Insert 65 again: second time is rejected (no duplicates).
- BST Delete 20 (leaf): inorder 30 40 50 60 70 80.
- BST Delete 30 (one child): inorder 40 50 60 70 80.
- BST Delete 50 (two children, root): new root 60, inorder 40 60 70 80.
- BST **Garden tree**: plant on tile (1,2) and search key 7: found. Insert/Delete buttons are blocked on the garden tree because it changes only when you plant or harvest.
- Refresh the page: code in the editor stays and unlocked panels are restored.

Suggested evidence: [insert screenshot(s) of the garden, tree traversal, BST search path and BST after delete]

## 6. Approved Technical Environment
- HTML5 / DOM / Vanilla JavaScript
- Tailwind CSS (CDN)
- Lucide Icons (CDN)
- Pyodide (Python runtime)
- External CSS (`css/style.css`)

No other library is used.

## 7. Project Version and Git Development
Current Version: **v0.7.0** (adds the Binary Search Tree)
Repository: garden-simulator
GitHub Repository:https://github.com/j4k3lm/Garden-Simulator/tree/main

## 8. AI Reflection
During the development of the Python-Based Garden Simulator, I used AI as a guide to help me understand the project and its programming concepts. Since I am still a beginner, AI helped me learn how to organize the project and understand how different data structures work.

AI helped me with the implementation of the required data structures, such as the 2D List for the garden grid, Stack for action history, Queue for climate events, and Hierarchical Tree for organizing the garden and planted crops. It also helped me understand BFS, Preorder, Inorder, and Postorder traversal, as well as the new Binary Search Tree operations: insert, search, and delete.

Whenever I had difficulty understanding the code or encountered errors, I used AI to explain the problem and suggest possible solutions. However, I still needed to check and test the suggestions to make sure they worked properly in my project. For the BST, I checked the search path, duplicate keys, and the three delete cases.

Through this experience, I learned that AI is a helpful tool for beginners, especially when learning new programming concepts. It made some parts of the development easier, but I also realized that I should understand the code and not just copy the answers.

## 9. Current Limitations and Next Steps
- The BST is not balanced. Sorted insertions make it skewed (worst case O(n)).
- BST keys are tile numbers 0 to 24 on the garden tree (0 to 99 on the demo tree).
- Game state (plants, day) resets on refresh; only the code and unlocked panels are saved.
- Next: balanced trees (AVL), Hash Table for crop lookup, Graph of garden zones with BFS/DFS, sorting plants.

## 10. Submission Summary
Version 0.7.0 integrates Python OOP, a 2D list garden grid, an action-history stack, a climate queue, a visible binary garden tree, tree traversals (BFS and DFS preorder, inorder, postorder) and a Binary Search Tree with insert, search and delete in one interactive simulator. Section 3 now shows the specific code block and key lines that power each structure, as requested for the Binary Search Tree activity.

## 11. Screenshots
[insert]

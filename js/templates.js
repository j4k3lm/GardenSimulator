// Python starter code for each topic (editable in the Student Code Editor).
const topicTemplates = {
1: { title: "1 · Python OOP: Resource Storage & Seed Bag", expect: "resources", code: `import json

class Crop:
    def __init__(self, name, emoji, category, cost, grow_days):
        self.name, self.emoji, self.category = name, emoji, category
        self.cost, self.grow_days = cost, grow_days

class ResourceStorage:
    MAX = {"water": 200, "seeds": 100, "energy": 120, "hope": 100}
    def __init__(self):
        self.water, self.seeds, self.energy = 200, 90, 110
        self.hope, self.coins = 65, 120
    def can_afford(self, coins=0, water=0, seeds=0):
        return self.coins >= coins and self.water >= water and self.seeds >= seeds
    def change(self, **delta):              # e.g. change(coins=-10, water=-5)
        for k, v in delta.items():
            val = getattr(self, k) + v
            setattr(self, k, max(0, min(val, self.MAX.get(k, 9999))))
        self.sync()
    def sync(self):
        updateResources(json.dumps(vars(self)))

CROPS = [Crop("Tomato", "🍅", "Vegetable", 10, 3), Crop("Eggplant", "🍆", "Vegetable", 12, 4),
         Crop("Basil", "🌿", "Herb", 6, 2), Crop("Sunflower", "🌻", "Flower", 8, 3),
         Crop("Rice", "🌾", "Grain", 9, 4)]

resources = ResourceStorage()
resources.sync()
addPlantsToDropdown(json.dumps([[c.name, c.emoji, c.cost] for c in CROPS]))
print("Resources ready. Crops loaded:", len(CROPS))` },

2: { title: "2 · Stack: Action History (LIFO)", expect: "history", code: `import json

class ActionHistoryStack:
    def __init__(self):
        self.items = []                      # top of stack = last element
    def push(self, action):                  # O(1)
        self.items.append(action); self.sync()
    def pop(self):                           # O(1)
        item = self.items.pop() if self.items else None
        self.sync(); return item
    def peek(self):
        return self.items[-1] if self.items else None
    def is_empty(self):
        return len(self.items) == 0
    def sync(self):
        setStack(json.dumps(self.items))

history = ActionHistoryStack()
history.sync()

def undo_last():
    a = history.pop()                        # LIFO: newest action first
    if a is None:
        return "Stack is empty."
    r, c = a["row"], a["col"]
    if grid.cells[r][c] is None:
        return "Nothing to undo there (already harvested)."
    grid.remove(r, c)
    tree.remove_plant(r, c)
    if "bst" in globals(): bst.delete(r * 5 + c)      # keep BST in sync
    resources.change(coins=a["cost"], seeds=1, water=5)
    refresh()
    return "Undid: " + a["label"]
print("Stack ready.")` },

3: { title: "3 · Queue: Climate Queue (FIFO)", expect: "climate", code: `import json, random
from collections import deque

class ClimateQueue:
    def __init__(self):
        self.items = deque(["Rain", "Drought", "Heatwave"])
    def enqueue(self, event):                # O(1)
        self.items.append(event); self.sync()
    def dequeue(self):                       # O(1)
        e = self.items.popleft() if self.items else None
        self.sync(); return e
    def sync(self):
        setQueue(json.dumps(list(self.items)))

EFFECTS = {"Rain": dict(water=40, hope=3), "Drought": dict(water=-50, hope=-5),
           "Heatwave": dict(energy=-20, hope=-3), "Sunny": dict(energy=25),
           "Pest": dict(hope=-6)}
climate = ClimateQueue()
climate.sync()
day = 1

def next_day():
    global day
    day += 1
    event = climate.dequeue()                # FIFO: oldest event happens first
    resources.change(coins=5, **EFFECTS.get(event, {}))
    climate.enqueue(random.choice(list(EFFECTS)))
    if "grid" in globals():
        grid.grow_all()
        refresh()
    setDay(day)
    return "Day %d: %s hit the garden." % (day, event)
print("Climate queue ready.")` },

4: { title: "4 · 2D List: Garden Grid", expect: "grid", code: `import json

class Plant:
    def __init__(self, crop):
        self.crop, self.age = crop, 0
    def ripe(self):
        return self.age >= self.crop.grow_days
    def stage(self):
        if self.age < self.crop.grow_days // 2: return "🌱"
        return self.crop.emoji if self.ripe() else "🪴"

class GardenGrid:
    def __init__(self, rows=5, cols=5):
        # 2D list: cells[row][col]. NOT [[None]*cols]*rows (shared rows!)
        self.cells = [[None for _ in range(cols)] for _ in range(rows)]
    def is_empty(self, r, c): return self.cells[r][c] is None   # O(1)
    def place(self, r, c, plant): self.cells[r][c] = plant      # O(1)
    def remove(self, r, c):
        p = self.cells[r][c]; self.cells[r][c] = None; return p
    def grow_all(self):                      # O(rows * cols)
        for row in self.cells:
            for p in row:
                if p: p.age += 1
    def count(self):
        return sum(1 for row in self.cells for p in row if p)
    def sync(self):
        setGrid(json.dumps([[{"e": p.stage(), "ripe": p.ripe()} if p else None
                             for p in row] for row in self.cells]))

grid = GardenGrid()

def plant_at(r, c, name):
    crop = next((x for x in CROPS if x.name == name), None)
    if crop is None: return "Choose a seed first."
    if not grid.is_empty(r, c): return "Tile (%d,%d) is occupied." % (r, c)
    if not resources.can_afford(coins=crop.cost, seeds=1, water=5):
        return "Not enough coins, seeds or water."
    grid.place(r, c, Plant(crop))
    resources.change(coins=-crop.cost, seeds=-1, water=-5)
    if "tree" in globals(): tree.add_plant(crop, r, c)
    if "bst" in globals(): bst.insert(r * 5 + c, "%s(%d,%d)" % (crop.name, r, c), crop.category)
    if "history" in globals():
        history.push({"row": r, "col": c, "cost": crop.cost,
                      "label": "Planted %s at (%d,%d)" % (crop.name, r, c)})
    refresh()
    return "Planted " + crop.name

def harvest_at(r, c):
    p = grid.cells[r][c]
    if p is None or not p.ripe(): return "Not ripe yet - keep ending days."
    grid.remove(r, c)
    if "tree" in globals(): tree.remove_plant(r, c)
    if "bst" in globals(): bst.delete(r * 5 + c)
    resources.change(coins=p.crop.cost * 2, hope=4, seeds=1)
    refresh()
    return "Harvested %s! +%d coins" % (p.crop.name, p.crop.cost * 2)

def refresh():
    grid.sync()
    if "tree" in globals(): tree.sync()
    if "bst" in globals(): bst_sync()
    setScore(min(100, grid.count() * 4 + resources.hope // 2 + resources.water // 10))

refresh()
print("5x5 grid ready.")` },

5: { title: "5 · Hierarchical Tree: Binary Garden Tree", expect: "tree", code: `import json
from collections import deque

class TreeNode:
    _next_id = 0
    def __init__(self, name, label=None, pos=None, cat="Garden"):
        TreeNode._next_id += 1
        self.id = TreeNode._next_id
        self.name, self.label, self.pos, self.cat = name, label or name, pos, cat
        self.parent = self.left = self.right = None
    def depth(self):                         # root = 0
        return 0 if self.parent is None else 1 + self.parent.depth()
    def height(self):                        # leaf = 0, O(n)
        l = self.left.height() if self.left else -1
        r = self.right.height() if self.right else -1
        return 1 + max(l, r)
    def size(self):                          # O(n)
        return 1 + (self.left.size() if self.left else 0) + (self.right.size() if self.right else 0)
    def to_dict(self):
        return {"id": self.id, "label": self.label, "name": self.name, "cat": self.cat,
                "left": self.left.to_dict() if self.left else None,
                "right": self.right.to_dict() if self.right else None}

class BinaryTree:
    def __init__(self, root):
        self.root = root
    def _level_list(self):                   # nodes top-to-bottom, left-to-right
        out, q = [], deque([self.root])
        while q:
            n = q.popleft(); out.append(n)
            if n.left: q.append(n.left)
            if n.right: q.append(n.right)
        return out
    def insert(self, node):                  # first free slot, O(n)
        for cur in self._level_list():
            if cur.left is None:  cur.left = node;  node.parent = cur; return
            if cur.right is None: cur.right = node; node.parent = cur; return
    def remove_pos(self, pos):               # O(n): last node fills the gap
        nodes = self._level_list()
        target = next((n for n in nodes if n.pos == pos), None)
        if target is None: return
        last = nodes[-1]
        if target is not last:
            target.name, target.label, target.pos, target.cat = last.name, last.label, last.pos, last.cat
        p = last.parent
        if p.right is last: p.right = None
        else: p.left = None
        last.parent = None

def show_tree(t, expected=None):
    data = {"root": t.root.to_dict(), "size": t.root.size(), "height": t.root.height(),
            "orders": {}, "expected": expected}
    for k in ("bfs", "preorder", "inorder", "postorder"):   # defined in Topic 6
        if k in globals():
            data["orders"][k] = [[n.id, n.name] for n in globals()[k](t.root)]
    setTree(json.dumps(data))

class GardenTree(BinaryTree):
    """Root = Garden. Every planted crop becomes a node (left/right children)."""
    def __init__(self):
        super().__init__(TreeNode("Garden", "🌳"))
    def add_plant(self, crop, r, c):
        self.insert(TreeNode("%s(%d,%d)" % (crop.name, r, c), crop.emoji, (r, c), crop.category))
    def remove_plant(self, r, c):
        self.remove_pos((r, c))
    def sync(self):
        show_tree(self)

tree = GardenTree()
tree.sync()
print("Binary tree ready. Root:", tree.root.name)` },

6: { title: "6 · Tree Traversal: BFS & DFS (Pre/In/Post)", expect: "bfs", code: `from collections import deque

def bfs(root):                               # Level order, uses a QUEUE, O(n)
    out, q = [], deque([root])
    while q:
        n = q.popleft(); out.append(n)
        if n.left:  q.append(n.left)
        if n.right: q.append(n.right)
    return out

def preorder(n, out=None):                   # Root -> Left -> Right
    out = [] if out is None else out
    if n:
        out.append(n); preorder(n.left, out); preorder(n.right, out)
    return out

def inorder(n, out=None):                    # Left -> Root -> Right
    out = [] if out is None else out
    if n:
        inorder(n.left, out); out.append(n); inorder(n.right, out)
    return out

def postorder(n, out=None):                  # Left -> Right -> Root
    out = [] if out is None else out
    if n:
        postorder(n.left, out); postorder(n.right, out); out.append(n)
    return out

def dfs_stack(root):                         # iterative DFS with an explicit STACK
    out, st = [], [root]
    while st:
        n = st.pop(); out.append(n)
        if n.right: st.append(n.right)       # push right first -> left pops first
        if n.left:  st.append(n.left)
    return out

# Lesson example: A(B(D,E), C(-,F))
def build_demo():
    ns = {k: TreeNode(k) for k in "ABCDEF"}
    for p, side, ch in [("A","left","B"), ("A","right","C"), ("B","left","D"),
                        ("B","right","E"), ("C","right","F")]:
        setattr(ns[p], side, ns[ch]); ns[ch].parent = ns[p]
    return BinaryTree(ns["A"])

EXPECTED = {"bfs": "A B C D E F", "preorder": "A B D E C F",
            "inorder": "D B E A C F", "postorder": "D E B F C A"}
def show_demo():
    show_tree(build_demo(), EXPECTED)

d = build_demo()
print("dfs_stack == preorder:", [n.name for n in dfs_stack(d.root)] == [n.name for n in preorder(d.root)])
if "tree" in globals(): tree.sync()
print("Traversals ready: BFS, Preorder, Inorder, Postorder")` },

7: { title: "7 · Binary Search Tree: Plant Finder (BST)", expect: "bst", code: `import json

class BSTNode:
    _next_id = 0
    def __init__(self, key, name=None, cat="Garden"):
        BSTNode._next_id += 1
        self.id = BSTNode._next_id
        self.key, self.name, self.cat = key, name or str(key), cat
        self.left = self.right = None
    def to_dict(self):
        return {"id": self.id, "label": str(self.key), "name": self.name, "cat": self.cat,
                "left": self.left.to_dict() if self.left else None,
                "right": self.right.to_dict() if self.right else None}

class BST:
    """Binary Search Tree rule: left keys < node key < right keys. No duplicates."""
    def __init__(self):
        self.root = None

    def insert(self, key, name=None, cat="Garden"):      # avg O(log n), worst O(n)
        new = BSTNode(key, name, cat)
        if self.root is None:
            self.root = new
            return True
        cur = self.root
        while True:
            if key == cur.key:
                return False                             # duplicate key -> reject
            if key < cur.key:                            # smaller -> go left
                if cur.left is None:
                    cur.left = new
                    return True
                cur = cur.left
            else:                                        # bigger -> go right
                if cur.right is None:
                    cur.right = new
                    return True
                cur = cur.right

    def search(self, key):                               # avg O(log n), worst O(n)
        path, cur = [], self.root
        while cur:
            path.append(cur.id)                          # remember every step
            if key == cur.key:
                return cur, path
            cur = cur.left if key < cur.key else cur.right
        return None, path

    def delete(self, key):                               # avg O(log n), worst O(n)
        self.root, deleted = self._delete(self.root, key)
        return deleted

    def _delete(self, node, key):
        if node is None:
            return None, False                           # key not in tree
        if key < node.key:
            node.left, done = self._delete(node.left, key)
            return node, done
        if key > node.key:
            node.right, done = self._delete(node.right, key)
            return node, done
        # --- found the node to delete ---
        if node.left is None:                            # case 1 (leaf) and case 2 (one child)
            return node.right, True
        if node.right is None:                           # case 2 (one child)
            return node.left, True
        succ = node.right                                # case 3 (two children):
        while succ.left:                                 # inorder successor = smallest key
            succ = succ.left                             # in the right subtree
        node.key, node.name, node.cat = succ.key, succ.name, succ.cat   # node mutation
        node.right, _ = self._delete(node.right, succ.key)              # remove the copy
        return node, True

# ----- DFS traversals (recursive) -----
def bst_inorder(n, out=None):                            # Left, Root, Right -> SORTED keys
    out = [] if out is None else out
    if n:
        bst_inorder(n.left, out); out.append(n); bst_inorder(n.right, out)
    return out
def bst_preorder(n, out=None):                           # Root, Left, Right
    out = [] if out is None else out
    if n:
        out.append(n); bst_preorder(n.left, out); bst_preorder(n.right, out)
    return out
def bst_postorder(n, out=None):                          # Left, Right, Root
    out = [] if out is None else out
    if n:
        bst_postorder(n.left, out); bst_postorder(n.right, out); out.append(n)
    return out
def bst_size(n):
    return 0 if n is None else 1 + bst_size(n.left) + bst_size(n.right)
def bst_height(n):
    return -1 if n is None else 1 + max(bst_height(n.left), bst_height(n.right))

# ----- the two trees -----
bst = BST()                      # garden tree: key = tile number = row * 5 + col
demo_bst = BST()                 # practice tree
DEMO_KEYS = [50, 30, 70, 20, 40, 60, 80]
for k in DEMO_KEYS:
    demo_bst.insert(k)
view = {"which": "garden"}

def current_bst():
    return bst if view["which"] == "garden" else demo_bst

def bst_sync(path=None, msg=""):
    t = current_bst()
    orders = {}
    for name, fn in (("inorder", bst_inorder), ("preorder", bst_preorder), ("postorder", bst_postorder)):
        orders[name] = [[n.id, str(n.key)] for n in fn(t.root)]
    setBST(json.dumps({"which": view["which"], "root": t.root.to_dict() if t.root else None,
                       "size": bst_size(t.root), "height": bst_height(t.root),
                       "orders": orders, "path": path or [], "msg": msg}))

def show_bst(which):
    view["which"] = which
    bst_sync()
    return "Showing the " + which + " BST."

def reset_demo():
    global demo_bst
    demo_bst = BST()
    for k in DEMO_KEYS:
        demo_bst.insert(k)
    view["which"] = "demo"
    bst_sync()
    return "Demo tree reset."

def bst_op(op, key):
    t = current_bst()
    if op == "search":
        node, path = t.search(key)
        if node:
            msg = "Found key %d (%s) in %d comparisons." % (key, node.name, len(path))
        else:
            msg = "Key %d not found (%d comparisons)." % (key, len(path))
        bst_sync(path, msg)
        return msg
    if view["which"] == "garden":
        msg = "The garden tree changes when you plant or harvest. Use the Demo tree to insert/delete."
    elif op == "insert":
        msg = ("Inserted %d." % key) if t.insert(key) else ("%d already exists." % key)
    else:
        msg = ("Deleted %d." % key) if t.delete(key) else ("%d not found." % key)
    bst_sync([], msg)
    return msg

# add plants that are already growing in the grid
if "grid" in globals():
    for r in range(5):
        for c in range(5):
            p = grid.cells[r][c]
            if p:
                bst.insert(r * 5 + c, "%s(%d,%d)" % (p.crop.name, r, c), p.crop.category)
bst_sync()
print("BST ready. Garden tree size:", bst_size(bst.root))` }
};

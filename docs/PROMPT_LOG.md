# PROMPT LOG

| Version | Prompt / Request |
|---|---|
| v0.1.0 | "Act as an expert Python DSA developer. Using the starter garden simulator HTML, write a `ResourceStorage` class and `Crop` class that run in Pyodide and update the Resource panel. Use only Tailwind, Lucide, Pyodide and vanilla JS." |
| v0.2.0 | "Add an `ActionHistoryStack` (push, pop, peek, is_empty) and an Undo button that reverses the last planting. No external libraries." |
| v0.3.0 | "Add a `ClimateQueue` using `collections.deque` (enqueue/dequeue). Each Next Day dequeues one event and changes resources." |
| v0.4.0 | "Add a 5x5 `GardenGrid` using a 2D list `cells[row][col]`. Plant on click, harvest ripe plants. Avoid `[[None]*5]*5`." |
| v0.5.0 | "Add a hierarchical `GardenTree` (Garden > Zone > Plant) with preorder (DFS) and level-order (BFS) traversal shown in the UI." |
| v0.5.1 | "I cannot see the Hierarchical Tree. Redraw it as a binary tree with circles and lines (root A on top, left and right children) like my reference image." |
| v0.6.0 | "Act as an expert Python DSA developer. Add BFS (queue, level order) and DFS preorder, inorder, postorder to my BinaryTree in Pyodide. Include an iterative DFS using a stack. Add buttons that animate the visiting order and a test using tree A(B(D,E),C(-,F)). No external libraries." |
| v0.7.0 | "Act as an expert Python DSA developer. Context: my garden simulator runs Python in Pyodide with a 5x5 grid, a stack, a queue and a binary tree; only Tailwind, Lucide, Pyodide and vanilla JS are allowed. Task: add a `BST` class with insert, search and delete (leaf, one child, two children using the inorder successor) where the key is the tile number row*5+col. Keep it in sync when I plant, harvest and undo. Show it as circles and lines, animate the search path, and add Inorder/Preorder/Postorder buttons. Constraints: no new libraries, no duplicate keys, explain every method line by line so I can defend it in recitation." |

# SEMANTIC VERSIONING TAGS
| Version | Semantic Versioning Tag | Description |
|---|---|---|
| v0.1.0 | MINOR | Initial sketch: OOP resource storage and seed bag. |
| v0.2.0 | MINOR | Added stack-based action history and undo. |
| v0.3.0 | MINOR | Added FIFO climate queue and Next Day. |
| v0.4.0 | MINOR | Added 2D-list garden grid, planting and harvesting. |
| v0.5.0 | MINOR | Added hierarchical tree with traversals. |
| v0.5.1 | PATCH | Fixed the tree not being visible: drew a node-and-edge diagram and made the tree binary. |
| v0.6.0 | MINOR | Added BFS and DFS (preorder, inorder, postorder) traversals with animation. |
| v0.7.0 | MINOR | Added Binary Search Tree (insert, search, delete) linked to planting, harvesting and undo. |

Rule: MAJOR = breaking change (x.0.0) | MINOR = new backward-compatible feature (0.x.0) | PATCH = bug fix (0.0.x). Versions starting with 0. are in the pre-release phase; v1.0.0 will be the final release.

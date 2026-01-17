import BinaryTreeMaxPathSum from '../problems/BinaryTreeMaxPathSum';
import HouseRobber from '../problems/HouseRobber';
import HouseRobberII from '../problems/HouseRobberII';
import SubarraySumK from '../problems/SubarraySumK';
import CoinChange from '../problems/CoinChange';
import CoinChangeII from '../problems/CoinChangeII';
import SubarraysWithKDistinct from '../problems/SubarraysWithKDistinct';
import ShortestPathBinaryMatrix from '../problems/ShortestPathBinaryMatrix';
import MinSwapsAlternating from '../problems/MinSwapsAlternating';

export const PROBLEMS = [
    {
        id: '124',
        title: 'Binary Tree Maximum Path Sum',
        difficulty: 'Hard',
        description: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge linking them. A node can only appear in the sequence at most once. Note that the path does not need to pass through the root. The path sum is the sum of the node\'s values in the path. Given the root of a binary tree, return the maximum path sum of any non-empty path.',
        component: BinaryTreeMaxPathSum,
        solutions: {
            java: `class Solution {
    int maxSum = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        maxGain(root);
        return maxSum;
    }

    private int maxGain(TreeNode node) {
        if (node == null) return 0;

        // Recursive max gain from left and right children
        // Do not include negative gains
        int leftGain = Math.max(maxGain(node.left), 0);
        int rightGain = Math.max(maxGain(node.right), 0);

        // Current max path through this node
        int currentPathSum = node.val + leftGain + rightGain;

        // Update global max
        maxSum = Math.max(maxSum, currentPathSum);

        // Return max gain for path continuing through parent
        return node.val + Math.max(leftGain, rightGain);
    }
}`,
            python: `class Solution:
    def maxPathSum(self, root: Optional[TreeNode]) -> int:
        self.max_sum = float('-inf')
        
        def max_gain(node):
            if not node:
                return 0
            
            # Recursive checks, ignoring negative contributions
            left_gain = max(max_gain(node.left), 0)
            right_gain = max(max_gain(node.right), 0)
            
            # Path through current node
            current_path_sum = node.val + left_gain + right_gain
            
            # Update global max
            self.max_sum = max(self.max_sum, current_path_sum)
            
            # Return gain for continuing path
            return node.val + max(left_gain, right_gain)
            
        max_gain(root)
        return self.max_sum`,
            cpp: `class Solution {
    int maxSum = INT_MIN;
public:
    int maxPathSum(TreeNode* root) {
        maxGain(root);
        return maxSum;
    }
    
    int maxGain(TreeNode* node) {
        if (!node) return 0;
        
        // Max gain from subtrees, ignore negative sums
        int leftGain = max(maxGain(node->left), 0);
        int rightGain = max(maxGain(node->right), 0);
        
        // Path through this node
        int currentPathSum = node->val + leftGain + rightGain;
        
        // Update global max
        maxSum = max(maxSum, currentPathSum);
        
        // Return gain up to parent
        return node->val + max(leftGain, rightGain);
    }
};`
        }
    },
    {
        id: '198',
        title: 'House Robber',
        difficulty: 'Medium',
        description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.',
        component: HouseRobber,
        solutions: {
            java: `class Solution {
    public int rob(int[] nums) {
        if (nums.length == 0) return 0;
        int prev1 = 0;
        int prev2 = 0;
        
        for (int num : nums) {
            int temp = prev1;
            prev1 = Math.max(prev2 + num, prev1);
            prev2 = temp;
        }
        
        return prev1;
    }
}`,
            python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        rob1, rob2 = 0, 0
        
        for n in nums:
             # [rob1, rob2, n, n+1, ...]
             temp = max(n + rob1, rob2)
             rob1 = rob2
             rob2 = temp
             
        return rob2`,
            cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        int rob1 = 0, rob2 = 0;
        
        for (int n : nums) {
            int temp = max(n + rob1, rob2);
            rob1 = rob2;
            rob2 = temp;
        }
        
        return rob2;
    }
};`
        }
    },
    {
        id: '213',
        title: 'House Robber II (Circular)',
        difficulty: 'Medium',
        description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circular fashion. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have a security system connected, and it will automatically contact the police if two adjacent houses were broken into on the same night.',
        component: HouseRobberII,
        solutions: {
            java: `class Solution {
    public int rob(int[] nums) {
        if (nums.length == 0) return 0;
        if (nums.length == 1) return nums[0];
        // Max of robbing either (0 to n-2) or (1 to n-1)
        return Math.max(robHelper(nums, 0, nums.length - 2), 
                        robHelper(nums, 1, nums.length - 1));
    }

    private int robHelper(int[] nums, int start, int end) {
        int rob1 = 0, rob2 = 0;
        for (int i = start; i <= end; i++) {
            int temp = Math.max(rob1 + nums[i], rob2);
            rob1 = rob2;
            rob2 = temp;
        }
        return rob2;
    }
}`,
            python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        if not nums: return 0
        if len(nums) == 1: return nums[0]

        def helper(arr):
            rob1, rob2 = 0, 0
            for n in arr:
                new_rob = max(rob1 + n, rob2)
                rob1 = rob2
                rob2 = new_rob
            return rob2

        return max(helper(nums[:-1]), helper(nums[1:]))`,
            cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        if (nums.empty()) return 0;
        if (nums.size() == 1) return nums[0];
        
        return max(robHelper(nums, 0, nums.size() - 2), 
                   robHelper(nums, 1, nums.size() - 1));
    }
    
    int robHelper(vector<int>& nums, int start, int end) {
        int rob1 = 0, rob2 = 0;
        for (int i = start; i <= end; i++) {
            int temp = max(rob1 + nums[i], rob2);
            rob1 = rob2;
            rob2 = temp;
        }
        return rob2;
    }
};`
        }
    },
    {
        id: '560',
        title: 'Subarray Sum Equals K',
        difficulty: 'Medium',
        description: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k. A subarray is a contiguous non-empty sequence of elements within an array.',
        component: SubarraySumK,
        solutions: {
            java: `class Solution {
    public int subarraySum(int[] nums, int k) {
        int count = 0, sum = 0;
        Map<Integer, Integer> map = new HashMap<>();
        map.put(0, 1);
        
        for (int num : nums) {
            sum += num;
            if (map.containsKey(sum - k))
                count += map.get(sum - k);
            map.put(sum, map.getOrDefault(sum, 0) + 1);
        }
        return count;
    }
}`,
            python: `class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        count = 0
        sum = 0
        map = {0: 1}
        
        for num in nums:
            sum += num
            if (sum - k) in map:
                count += map[sum - k]
            map[sum] = map.get(sum, 0) + 1
            
        return count`,
            cpp: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        int count = 0;
        int sum = 0;
        unordered_map<int, int> map;
        map[0] = 1;
        
        for (int num : nums) {
            sum += num;
            if (map.find(sum - k) != map.end()) {
                count += map[sum - k];
            }
            map[sum]++;
        }
        return count;
    }
};`
        }
    },
    {
        id: '322',
        title: 'Coin Change',
        difficulty: 'Medium',
        description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin.',
        component: CoinChange,
        solutions: {
            java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int max = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, max);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
            python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        
        for min_coin in range(1, amount + 1):
            for coin in coins:
                if coin <= min_coin:
                    dp[min_coin] = min(dp[min_coin], dp[min_coin - coin] + 1)
                    
        return dp[amount] if dp[amount] != float('inf') else -1`,
            cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int Max = amount + 1;
        vector<int> dp(amount + 1, Max);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`
        }
    },
    {
        id: '518',
        title: 'Coin Change II',
        difficulty: 'Medium',
        description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the number of combinations that make up that amount. You may assume that you have an infinite number of each kind of coin.',
        component: CoinChangeII,
        solutions: {
            java: `class Solution {
    public int change(int amount, int[] coins) {
        int[] dp = new int[amount + 1];
        dp[0] = 1;

        for (int coin : coins) {
            for (int x = coin; x < amount + 1; ++x) {
                dp[x] += dp[x - coin];
            }
        }
        return dp[amount];
    }
}`,
            python: `class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        dp = [0] * (amount + 1)
        dp[0] = 1
        
        for coin in coins:
            for x in range(coin, amount + 1):
                dp[x] += dp[x - coin]
                
        return dp[amount]`,
            cpp: `class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<int> dp(amount + 1);
        dp[0] = 1;
        
        for (const int& coin : coins) {
            for (int i = coin; i <= amount; ++i) {
                dp[i] += dp[i - coin];
            }
        }
        return dp[amount];
    }
};`
        }
    },
    {
        id: '992',
        title: 'Subarrays with K Different Integers',
        difficulty: 'Hard',
        description: 'Given an integer array nums and an integer k, return the number of good subarrays of nums. A good subarray is a subarray where the number of different integers in that subarray is exactly k. For example, [1,2,3,1,2] has 3 different integers: 1, 2, and 3.',
        component: SubarraysWithKDistinct,
        solutions: {
            java: `class Solution {
    public int subarraysWithKDistinct(int[] nums, int k) {
        return atMostK(nums, k) - atMostK(nums, k - 1);
    }
    
    private int atMostK(int[] nums, int k) {
        int start = 0, res = 0;
        Map<Integer, Integer> count = new HashMap<>();
        for (int end = 0; end < nums.length; ++end) {
            if (count.getOrDefault(nums[end], 0) == 0) k--;
            count.put(nums[end], count.getOrDefault(nums[end], 0) + 1);
            while (k < 0) {
                count.put(nums[start], count.get(nums[start]) - 1);
                if (count.get(nums[start]) == 0) k++;
                start++;
            }
            res += end - start + 1;
        }
        return res;
    }
}`,
            python: `class Solution:
    def subarraysWithKDistinct(self, nums: List[int], k: int) -> int:
        return self.atMostK(nums, k) - self.atMostK(nums, k - 1)
        
    def atMostK(self, nums, k):
        count = collections.Counter()
        res = i = 0
        for j in range(len(nums)):
            if count[nums[j]] == 0: k -= 1
            count[nums[j]] += 1
            while k < 0:
                count[nums[i]] -= 1
                if count[nums[i]] == 0: k += 1
                i += 1
            res += j - i + 1
        return res`,
            cpp: `class Solution {
public:
    int subarraysWithKDistinct(vector<int>& nums, int k) {
        return atMostK(nums, k) - atMostK(nums, k - 1);
    }
    
    int atMostK(vector<int>& nums, int k) {
        int i = 0, res = 0;
        unordered_map<int, int> count;
        for (int j = 0; j < nums.size(); ++j) {
            if (!count[nums[j]]++) k--;
            while (k < 0) {
                if (!--count[nums[i]]) k++;
                i++;
            }
            res += j - i + 1;
        }
        return res;
    }
};`
        }
    },
    {
        id: '1091',
        title: 'Shortest Path in Binary Matrix',
        difficulty: 'Medium',
        description: 'Given an n x n binary matrix grid, return the length of the shortest clear path in the matrix. If there is no clear path, return -1. A clear path in a binary matrix is a path from the top-left cell (i.e., (0, 0)) to the bottom-right cell (i.e., (n - 1, n - 1)) such that: All the visited cells of the path are 0. All the adjacent cells of the path are 8-directionally connected (i.e., they are different and they share an edge or a corner).',
        component: ShortestPathBinaryMatrix,
        solutions: {
            java: `class Solution {
    public int shortestPathBinaryMatrix(int[][] grid) {
        if (grid[0][0] == 1) return -1;
        int n = grid.length;
        int[][] dirs = {{-1, -1}, {-1, 0}, {-1, 1}, {0, -1}, {0, 1}, {1, -1}, {1, 0}, {1, 1}};
        boolean[][] visited = new boolean[n][n];
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{0, 0});
        visited[0][0] = true;
        int path = 1;

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();
                int r = cell[0], c = cell[1];
                if (r == n - 1 && c == n - 1) return path;

                for (int[] d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0 && !visited[nr][nc]) {
                        queue.offer(new int[]{nr, nc});
                        visited[nr][nc] = true;
                    }
                }
            }
            path++;
        }
        return -1;
    }
}`,
            python: `class Solution:
    def shortestPathBinaryMatrix(self, grid: List[List[int]]) -> int:
        if grid[0][0] == 1: return -1
        n = len(grid)
        queue = deque([(0, 0, 1)])
        grid[0][0] = 1 # visited
        
        while queue:
            r, c, path = queue.popleft()
            if r == n - 1 and c == n - 1: return path
            
            for dr, dc in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                    grid[nr][nc] = 1
                    queue.append((nr, nc, path + 1))
                    
        return -1`,
            cpp: `class Solution {
public:
    int shortestPathBinaryMatrix(vector<vector<int>>& grid) {
        if (grid[0][0] == 1) return -1;
        int n = grid.size();
        queue<pair<int, int>> q;
        q.push({0, 0});
        grid[0][0] = 1; // Mark as visited with distance
        
        int dirs[8][2] = {{-1, -1}, {-1, 0}, {-1, 1}, {0, -1}, {0, 1}, {1, -1}, {1, 0}, {1, 1}};
        
        while (!q.empty()) {
            auto [r, c] = q.front(); q.pop();
            if (r == n - 1 && c == n - 1) return grid[r][c];
            
            for (auto& d : dirs) {
                int nr = r + d[0];
                int nc = c + d[1];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                    q.push({nr, nc});
                    grid[nr][nc] = grid[r][c] + 1;
                }
            }
        }
        return -1;
    }
};`
        }
    },
    {
        id: '1864',
        title: 'Min Swaps to Make Alternating',
        difficulty: 'Medium',
        description: 'Given a binary string s, return the minimum number of character swaps to make it alternating, or -1 if it is impossible. The string is called alternating if no two adjacent characters are equal. For example, the strings "010" and "1010" are alternating, while the string "0100" is not.',
        component: MinSwapsAlternating,
        solutions: {
            java: `class Solution {
    public int minSwaps(String s) {
        int ones = 0, zeros = 0;
        for (char c : s.toCharArray()) {
            if (c == '1') ones++;
            else zeros++;
        }
        
        if (Math.abs(ones - zeros) > 1) return -1;
        
        if (ones > zeros) return helper(s, '1');
        else if (zeros > ones) return helper(s, '0');
        else return Math.min(helper(s, '1'), helper(s, '0'));
    }
    
    private int helper(String s, char start) {
        int swaps = 0;
        for (int i = 0; i < s.length(); i += 2) {
            if (s.charAt(i) != start) swaps++;
        }
        return swaps;
    }
}`,
            python: `class Solution:
    def minSwaps(self, s: str) -> int:
        ones = s.count('1')
        zeros = s.count('0')
        if abs(ones - zeros) > 1: return -1
        
        def count_swaps(start_char):
            swaps = 0
            for i in range(0, len(s), 2):
                if s[i] != start_char:
                    swaps += 1
            return swaps
            
        if ones > zeros: return count_swaps('1')
        elif zeros > ones: return count_swaps('0')
        else: return min(count_swaps('1'), count_swaps('0'))`,
            cpp: `class Solution {
public:
    int minSwaps(string s) {
        int ones = 0, zeros = 0;
        for (char c : s) {
            if (c == '1') ones++; else zeros++;
        }
        if (abs(ones - zeros) > 1) return -1;
        
        if (ones > zeros) return helper(s, '1');
        else if (zeros > ones) return helper(s, '0');
        else return min(helper(s, '1'), helper(s, '0'));
    }
    
    int helper(string& s, char start) {
        int swaps = 0;
        for (int i = 0; i < s.length(); i += 2) {
            if (s[i] != start) swaps++;
        }
        return swaps;
    }
};`
        }
    },
];

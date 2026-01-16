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
        component: BinaryTreeMaxPathSum
    },
    {
        id: '198',
        title: 'House Robber',
        difficulty: 'Medium',
        description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night. Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.',
        component: HouseRobber
    },
    {
        id: '213',
        title: 'House Robber II (Circular)',
        difficulty: 'Medium',
        description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circular fashion. That means the first house is the neighbor of the last one. Meanwhile, adjacent houses have a security system connected, and it will automatically contact the police if two adjacent houses were broken into on the same night.',
        component: HouseRobberII
    },
    {
        id: '560',
        title: 'Subarray Sum Equals K',
        difficulty: 'Medium',
        description: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k. A subarray is a contiguous non-empty sequence of elements within an array.',
        component: SubarraySumK
    },
    {
        id: '322',
        title: 'Coin Change',
        difficulty: 'Medium',
        description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin.',
        component: CoinChange
    },
    {
        id: '518',
        title: 'Coin Change II',
        difficulty: 'Medium',
        description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the number of combinations that make up that amount. You may assume that you have an infinite number of each kind of coin.',
        component: CoinChangeII
    },
    {
        id: '992',
        title: 'Subarrays with K Different Integers',
        difficulty: 'Hard',
        description: 'Given an integer array nums and an integer k, return the number of good subarrays of nums. A good subarray is a subarray where the number of different integers in that subarray is exactly k. For example, [1,2,3,1,2] has 3 different integers: 1, 2, and 3.',
        component: SubarraysWithKDistinct
    },
    {
        id: '1091',
        title: 'Shortest Path in Binary Matrix',
        difficulty: 'Medium',
        description: 'Given an n x n binary matrix grid, return the length of the shortest clear path in the matrix. If there is no clear path, return -1. A clear path in a binary matrix is a path from the top-left cell (i.e., (0, 0)) to the bottom-right cell (i.e., (n - 1, n - 1)) such that: All the visited cells of the path are 0. All the adjacent cells of the path are 8-directionally connected (i.e., they are different and they share an edge or a corner).',
        component: ShortestPathBinaryMatrix
    },
    {
        id: '1864',
        title: 'Min Swaps to Make Alternating',
        difficulty: 'Medium',
        description: 'Given a binary string s, return the minimum number of character swaps to make it alternating, or -1 if it is impossible. The string is called alternating if no two adjacent characters are equal. For example, the strings "010" and "1010" are alternating, while the string "0100" is not.',
        component: MinSwapsAlternating
    },
];

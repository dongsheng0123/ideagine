---
layout: doc
sidebar: false
aside: false
---

# 关于主题色提取与搭配

[< 返回主题色提取](/color)

## 简述

这是笔者会用的配色方法之一。

简述下原理，就是寻找一张意向参考图，提取其中的主要颜色，作为系列产品的配色。

在PS里，笔者一般用滤镜-晶格化进行操作，在这里干脆做成一个实用工具供大家使用。

工具使用的 K-Means++ 聚类算法，会导致轻微的颜色混合，这会使颜色组合更协调（如果是复杂场景，仅有几种颜色的矢量图倒是不太影响），但不适宜提取出具有强烈对比效果的颜色。这也是这个工具的局限性。

## 案例

比如要用参考图中的家居配色为下面几个瓶子配色：

![找好一张参考图](\public\color-intructions-image1.jpg)

![提取一下主题色，数量设置为3种](\public\color-intructions-image2.jpg)

![为每个瓶子配色](\public\color-intructions-image3.jpg)
#include "tradelab/order_book.hpp"
#include <gtest/gtest.h>
#include <stdexcept>

using namespace tradelab;

TEST(OrderBook, MatchesBestPriceBeforeArrivalTime) {
    OrderBook book;
    book.add({"expensive", Side::Sell, 105, 10});
    book.add({"cheap", Side::Sell, 100, 10});
    const auto trades = book.add({"buyer", Side::Buy, 105, 15});
    ASSERT_EQ(trades.size(), 2u);
    EXPECT_EQ(trades[0].maker_id, "cheap");
    EXPECT_EQ(trades[0].price_cents, 100);
    EXPECT_EQ(trades[1].quantity, 5);
    EXPECT_EQ(book.resting_quantity("expensive"), 5);
}
TEST(OrderBook, PreservesFifoAtTheSamePrice) {
    OrderBook book;
    book.add({"first", Side::Buy, 100, 5});
    book.add({"second", Side::Buy, 100, 5});
    const auto trades = book.add({"seller", Side::Sell, 99, 7});
    ASSERT_EQ(trades.size(), 2u);
    EXPECT_EQ(trades[0].maker_id, "first");
    EXPECT_EQ(trades[0].price_cents, 100);
    EXPECT_EQ(trades[1].maker_id, "second");
    EXPECT_EQ(book.resting_quantity("second"), 3);
}
TEST(OrderBook, DoesNotCrossOutsideTheLimit) {
    OrderBook book;
    book.add({"ask", Side::Sell, 101, 10});
    EXPECT_TRUE(book.add({"bid", Side::Buy, 100, 5}).empty());
    EXPECT_EQ(book.resting_quantity("ask"), 10);
    EXPECT_EQ(book.resting_quantity("bid"), 5);
}
TEST(OrderBook, RestsUnfilledRemainderAndCancelsIt) {
    OrderBook book;
    book.add({"ask", Side::Sell, 100, 3});
    book.add({"bid", Side::Buy, 100, 8});
    EXPECT_EQ(book.resting_quantity("bid"), 5);
    EXPECT_TRUE(book.cancel("bid"));
    EXPECT_EQ(book.resting_quantity("bid"), 0);
    EXPECT_FALSE(book.cancel("bid"));
    EXPECT_FALSE(book.cancel("unknown"));
}
TEST(OrderBook, RejectsInvalidAndReusedIds) {
    OrderBook book;
    EXPECT_THROW(book.add({"", Side::Buy, 100, 5}), std::invalid_argument);
    EXPECT_THROW(book.add({"bad", Side::Buy, 0, 5}), std::invalid_argument);
    EXPECT_THROW(book.add({"bad", Side::Buy, 100, -1}), std::invalid_argument);
    book.add({"id", Side::Buy, 100, 5});
    EXPECT_THROW(book.add({"id", Side::Buy, 100, 5}), std::invalid_argument);
    book.cancel("id");
    EXPECT_THROW(book.add({"id", Side::Buy, 100, 5}), std::invalid_argument);
}

TEST(OrderBook, MarketOrdersSweepPricesAndCancelUnfilledQuantity) {
    OrderBook book;
    book.add({"first", Side::Sell, 100, 2});
    book.add({"second", Side::Sell, 105, 3});
    const auto report = book.submit({"market", Side::Buy, 0, 8, OrderType::Market});
    EXPECT_EQ(report.status, "cancelled");
    EXPECT_EQ(report.filled_quantity, 5);
    EXPECT_EQ(report.cancelled_quantity, 3);
    EXPECT_EQ(report.remaining_quantity, 0);
    ASSERT_EQ(report.trades.size(), 2u);
    EXPECT_EQ(report.trades[0].price_cents, 100);
    EXPECT_EQ(report.trades[1].price_cents, 105);
    EXPECT_EQ(book.resting_quantity("market"), 0);
}

TEST(OrderBook, EmptyMarketOrderNeverRests) {
    OrderBook book;
    const auto report = book.submit({"market", Side::Sell, 0, 4, OrderType::Market});
    EXPECT_EQ(report.status, "cancelled");
    EXPECT_EQ(report.cancelled_quantity, 4);
    EXPECT_TRUE(report.trades.empty());
    EXPECT_EQ(book.resting_quantity("market"), 0);
    EXPECT_THROW(book.submit({"market", Side::Sell, 0, 4, OrderType::Market}), std::invalid_argument);
}

TEST(OrderBook, ReportsPartialLimitFillsAndFullMarketFills) {
    OrderBook book;
    book.add({"bid", Side::Buy, 100, 3});
    const auto limit = book.submit({"ask", Side::Sell, 99, 5});
    EXPECT_EQ(limit.status, "partially_filled");
    EXPECT_EQ(limit.filled_quantity, 3);
    EXPECT_EQ(limit.remaining_quantity, 2);
    EXPECT_EQ(limit.cancelled_quantity, 0);
    const auto market = book.submit({"taker", Side::Buy, 0, 2, OrderType::Market});
    EXPECT_EQ(market.status, "filled");
    EXPECT_EQ(market.filled_quantity, 2);
    EXPECT_EQ(market.cancelled_quantity, 0);
    EXPECT_EQ(market.trades[0].price_cents, 99);
}

TEST(OrderBook, MarketPriceMustBeZeroAndInvalidInputDoesNotConsumeId) {
    OrderBook book;
    EXPECT_THROW(book.submit({"m", Side::Buy, 100, 1, OrderType::Market}), std::invalid_argument);
    EXPECT_NO_THROW(book.submit({"m", Side::Buy, 0, 1, OrderType::Market}));
    EXPECT_THROW(book.submit({"bad", Side::Buy, 100, 1, static_cast<OrderType>(9)}), std::invalid_argument);
}

TEST(OrderBook, MarketSellUsesHighestBidsFirst) {
    OrderBook book;
    book.add({"low", Side::Buy, 95, 3});
    book.add({"high", Side::Buy, 105, 2});
    const auto report = book.submit({"sell", Side::Sell, 0, 4, OrderType::Market});
    EXPECT_EQ(report.status, "filled");
    ASSERT_EQ(report.trades.size(), 2u);
    EXPECT_EQ(report.trades[0].maker_id, "high");
    EXPECT_EQ(report.trades[0].price_cents, 105);
    EXPECT_EQ(report.trades[1].quantity, 2);
    EXPECT_EQ(book.resting_quantity("low"), 1);
}

-- CreateEnum
CREATE TYPE "TransportLifecycleStatus" AS ENUM ('REQUESTED', 'BIDDING', 'ACCEPTED', 'DRIVER_ASSIGNED', 'GOODS_COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransportBidStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TransportVehicleType" AS ENUM ('BAKKIE', 'TRUCK', 'LORRY', 'TRACTOR');

-- CreateEnum
CREATE TYPE "TransportUrgency" AS ENUM ('STANDARD', 'SAME_DAY', 'EXPRESS');

-- CreateTable
CREATE TABLE "transporter_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleType" "TransportVehicleType" NOT NULL,
    "regNumber" TEXT NOT NULL,
    "capacityKg" DOUBLE PRECISION NOT NULL,
    "coverageProvinces" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "routePolyline" TEXT,
    "goodsDescription" TEXT NOT NULL,
    "goodsType" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "vehicleType" "TransportVehicleType",
    "urgency" "TransportUrgency" NOT NULL DEFAULT 'STANDARD',
    "extras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedPriceUsdCents" INTEGER NOT NULL,
    "pricingBreakdown" JSONB,
    "status" "TransportLifecycleStatus" NOT NULL DEFAULT 'REQUESTED',
    "preferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_bids" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "amountUsdCents" INTEGER NOT NULL,
    "note" TEXT,
    "etaMinutes" INTEGER,
    "status" "TransportBidStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_bookings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "acceptedBidId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "routePolyline" TEXT,
    "agreedPriceUsdCents" INTEGER NOT NULL,
    "status" "TransportLifecycleStatus" NOT NULL DEFAULT 'ACCEPTED',
    "goodsCollectedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporter_locations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "bookingId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transporter_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_pricing_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_pricing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transporter_profiles_userId_key" ON "transporter_profiles"("userId");

-- CreateIndex
CREATE INDEX "transporter_profiles_tenantId_isAvailable_idx" ON "transporter_profiles"("tenantId", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_requests_tenantId_status_idx" ON "transport_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "transport_requests_tenantId_customerId_idx" ON "transport_requests"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_bids_requestId_transporterId_key" ON "transport_bids"("requestId", "transporterId");

-- CreateIndex
CREATE INDEX "transport_bids_tenantId_requestId_idx" ON "transport_bids"("tenantId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_bookings_requestId_key" ON "transport_bookings"("requestId");

-- CreateIndex
CREATE INDEX "transport_bookings_tenantId_customerId_idx" ON "transport_bookings"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "transport_bookings_tenantId_transporterId_idx" ON "transport_bookings"("tenantId", "transporterId");

-- CreateIndex
CREATE INDEX "transport_bookings_tenantId_status_idx" ON "transport_bookings"("tenantId", "status");

-- CreateIndex
CREATE INDEX "transporter_locations_tenantId_transporterId_recordedAt_idx" ON "transporter_locations"("tenantId", "transporterId", "recordedAt");

-- CreateIndex
CREATE INDEX "transporter_locations_bookingId_recordedAt_idx" ON "transporter_locations"("bookingId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "transport_pricing_configs_tenantId_key" ON "transport_pricing_configs"("tenantId");

-- AddForeignKey
ALTER TABLE "transporter_profiles" ADD CONSTRAINT "transporter_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_profiles" ADD CONSTRAINT "transporter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bookings" ADD CONSTRAINT "transport_bookings_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_locations" ADD CONSTRAINT "transporter_locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_locations" ADD CONSTRAINT "transporter_locations_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_locations" ADD CONSTRAINT "transporter_locations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "transport_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_pricing_configs" ADD CONSTRAINT "transport_pricing_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

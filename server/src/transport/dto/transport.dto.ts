import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  TransportLifecycleStatus,
  TransportUrgency,
  TransportVehicleType,
} from '@prisma/client';

export class CreateTransportRequestDto {
  @IsString() @MinLength(2) @MaxLength(300)
  pickupAddress!: string;

  @IsNumber() @IsLatitude()
  pickupLat!: number;

  @IsNumber() @IsLongitude()
  pickupLng!: number;

  @IsString() @MinLength(2) @MaxLength(300)
  destinationAddress!: string;

  @IsNumber() @IsLatitude()
  destinationLat!: number;

  @IsNumber() @IsLongitude()
  destinationLng!: number;

  @IsString() @MinLength(2) @MaxLength(400)
  goodsDescription!: string;

  @IsString() @MinLength(2) @MaxLength(80)
  goodsType!: string;

  @IsNumber() @Min(1) @Max(100_000)
  weightKg!: number;

  @IsOptional()
  @IsEnum(TransportVehicleType)
  vehicleType?: TransportVehicleType;

  @IsOptional()
  @IsEnum(TransportUrgency)
  urgency?: TransportUrgency;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];

  @IsOptional()
  @IsString()
  preferredAt?: string;
}

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(250)
  radiusKm?: number;
}

export class CreateBidDto {
  @IsInt()
  @Min(100)
  amountUsdCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7 * 24 * 60)
  etaMinutes?: number;
}

export class UpdateBidDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  amountUsdCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;

  @IsOptional()
  @IsEnum(['WITHDRAWN'])
  status?: 'WITHDRAWN';
}

export class UpdateBookingStatusDto {
  @IsEnum(TransportLifecycleStatus)
  status!: TransportLifecycleStatus;
}

export class DriverLocationDto {
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;
}

export class PricingQuoteDto {
  @IsNumber() @Min(1)
  distanceKm!: number;

  @IsNumber() @Min(1) @Max(100_000)
  weightKg!: number;

  @IsString() @MaxLength(80)
  goodsType!: string;

  @IsOptional()
  @IsEnum(TransportVehicleType)
  vehicleType?: TransportVehicleType;

  @IsOptional()
  @IsEnum(TransportUrgency)
  urgency?: TransportUrgency;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];
}

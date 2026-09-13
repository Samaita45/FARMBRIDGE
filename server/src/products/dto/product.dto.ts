import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Money arrives in cents, never as a float.
 *
 * A price typed as 12.30 becomes 12.299999999999999 somewhere between the
 * keyboard and the database, and the farmer is short a cent on every sale. The
 * app multiplies by 100 and rounds once, at the edge, and everything inland is
 * an integer.
 */
export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsString() @MinLength(2) @MaxLength(60)
  category!: string;

  /** Capped at $100,000 a unit: a typo, not a transaction. */
  @IsInt() @Min(1) @Max(10_000_000)
  priceUsdCents!: number;

  @IsOptional() @IsString() @MaxLength(20)
  unit?: string;

  @IsNumber() @Min(0) @Max(1_000_000)
  @Type(() => Number)
  quantity!: number;

  @IsOptional() @IsString() @MaxLength(60)
  province?: string;

  /*
    Remote URLs only, and at most six. The app uploads elsewhere and sends the
    resulting links; accepting arbitrary strings here would let a listing carry
    a `javascript:` or `data:` URL straight into every buyer's image view.
  */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  imageUrls?: string[];

  /**
   * A seller may save a draft before it is ready to be seen. Anything else is
   * decided by the server — a seller cannot publish straight to SUSPENDED, and
   * SOLD_OUT follows from quantity rather than from a request.
   */
  @IsOptional()
  @IsEnum([ProductStatus.DRAFT, ProductStatus.ACTIVE])
  status?: typeof ProductStatus.DRAFT | typeof ProductStatus.ACTIVE;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(60)
  category?: string;

  @IsOptional() @IsInt() @Min(1) @Max(10_000_000)
  priceUsdCents?: number;

  @IsOptional() @IsString() @MaxLength(20)
  unit?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000)
  @Type(() => Number)
  quantity?: number;

  @IsOptional() @IsString() @MaxLength(60)
  province?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsEnum([ProductStatus.DRAFT, ProductStatus.ACTIVE, ProductStatus.SOLD_OUT])
  status?: ProductStatus;
}

export class ListProductsQueryDto {
  @IsOptional() @IsString() @MaxLength(60)
  category?: string;

  @IsOptional() @IsString() @MaxLength(60)
  province?: string;

  @IsOptional() @IsString() @MaxLength(120)
  search?: string;

  @IsOptional() @IsInt() @Min(1) @Max(100)
  @Type(() => Number)
  limit?: number;

  /** Id of the last row from the previous page. */
  @IsOptional() @IsString() @MaxLength(64)
  cursor?: string;
}

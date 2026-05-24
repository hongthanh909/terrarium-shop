import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createProductSchema } from "@/lib/validations";
import { z } from "zod";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (slug) {
      // Get single product by slug
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: true,
          variantOptions: true,
          careGuide: true,
          reviews: {
            where: { approved: true },
            include: {
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json(product);
    }
    const status = searchParams.get("status");

    // Get products with filters
    const where: any = {};
    if (status !== "all") {
      where.status = "ACTIVE";
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured === "true") {
      where.featured = true;
    }

    // Search by name or slug
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.product.count({ where });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createProductSchema.parse(body);
    
    const {
      slug,
      name,
      basePrice,
      type = "PRODUCT",
      categoryId,
      status = "DRAFT",
      images = [],
      variants = [],
      variantOptions = [],
      careGuideData,
    } = validatedData;

    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          slug,
          name,
          basePrice,
          type,
          categoryId,
          status,
          images,
        },
      });

      // Create variants
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: any) => ({
            productId: newProduct.id,
            variantType: v.variantType,
            value: v.value,
            priceAdjustment: parseFloat(v.priceAdjustment) || 0,
            inventory: v.inventory || 0,
            sku: v.sku,
          })),
        });
      }

      // Create variant options
      if (variantOptions.length > 0) {
        await tx.productVariantOption.createMany({
          data: variantOptions.map((o: any) => ({
            productId: newProduct.id,
            variantType: o.variantType,
            options: o.options,
            image: o.image,
          })),
        });
      }

      // Create care guide if provided
      if (careGuideData) {
        await tx.careGuide.create({
          data: {
            watering: careGuideData.watering || "",
            sunlight: careGuideData.sunlight || "",
            temperature: careGuideData.temperature || "",
            humidity: careGuideData.humidity || "",
            commonIssues: careGuideData.commonIssues ?? null,
            videoUrl: careGuideData.videoUrl ?? null,
            productId: newProduct.id,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: true,
          variants: true,
          variantOptions: true,
        },
      });
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
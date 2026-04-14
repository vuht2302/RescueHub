using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Persistence;

public partial class RescueHubDbContext : DbContext
{
    public RescueHubDbContext(DbContextOptions<RescueHubDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ai_goi_y> ai_goi_ies { get; set; }

    public virtual DbSet<ai_nhiem_vu> ai_nhiem_vus { get; set; }

    public virtual DbSet<bao_cao_hien_truong> bao_cao_hien_truongs { get; set; }

    public virtual DbSet<bao_cao_hien_truong_tep_tin> bao_cao_hien_truong_tep_tins { get; set; }

    public virtual DbSet<canh_bao_kho> canh_bao_khos { get; set; }

    public virtual DbSet<cap_do_ky_nang> cap_do_ky_nangs { get; set; }

    public virtual DbSet<chi_tiet_cap_phat_cuu_tro> chi_tiet_cap_phat_cuu_tros { get; set; }

    public virtual DbSet<chi_tiet_dieu_chuyen_kho> chi_tiet_dieu_chuyen_khos { get; set; }

    public virtual DbSet<chi_tiet_hien_truong> chi_tiet_hien_truongs { get; set; }

    public virtual DbSet<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; }

    public virtual DbSet<chi_tiet_phieu_kho> chi_tiet_phieu_khos { get; set; }

    public virtual DbSet<chi_tiet_yeu_cau_cuu_tro> chi_tiet_yeu_cau_cuu_tros { get; set; }

    public virtual DbSet<chien_dich_cuu_tro> chien_dich_cuu_tros { get; set; }

    public virtual DbSet<chinh_sach_xuat_kho> chinh_sach_xuat_khos { get; set; }

    public virtual DbSet<chung_chi> chung_chis { get; set; }

    public virtual DbSet<chung_chi_thanh_vien> chung_chi_thanh_viens { get; set; }

    public virtual DbSet<cong_dan> cong_dans { get; set; }

    public virtual DbSet<danh_gia_su_co> danh_gia_su_cos { get; set; }

    public virtual DbSet<dat_cho_ton_kho> dat_cho_ton_khos { get; set; }

    public virtual DbSet<dia_diem> dia_diems { get; set; }

    public virtual DbSet<diem_cuu_tro> diem_cuu_tros { get; set; }

    public virtual DbSet<doi_cuu_ho> doi_cuu_hos { get; set; }

    public virtual DbSet<doi_phuong_tien> doi_phuong_tiens { get; set; }

    public virtual DbSet<don_vi> don_vis { get; set; }

    public virtual DbSet<don_vi_tinh> don_vi_tinhs { get; set; }

    public virtual DbSet<ho_dan> ho_dans { get; set; }

    public virtual DbSet<incident_type_scene_factor> incident_type_scene_factors { get; set; }

    public virtual DbSet<kenh_tiep_nhan> kenh_tiep_nhans { get; set; }

    public virtual DbSet<kho> khos { get; set; }

    public virtual DbSet<khu_kho> khu_khos { get; set; }

    public virtual DbSet<khu_vuc_hanh_chinh> khu_vuc_hanh_chinhs { get; set; }

    public virtual DbSet<ky_nang> ky_nangs { get; set; }

    public virtual DbSet<ky_nang_thanh_vien> ky_nang_thanh_viens { get; set; }

    public virtual DbSet<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khos { get; set; }

    public virtual DbSet<lich_su_chuyen_doi> lich_su_chuyen_dois { get; set; }

    public virtual DbSet<lich_su_san_sang_thanh_vien> lich_su_san_sang_thanh_viens { get; set; }

    public virtual DbSet<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vus { get; set; }

    public virtual DbSet<lich_su_trang_thai_phuong_tien> lich_su_trang_thai_phuong_tiens { get; set; }

    public virtual DbSet<lich_su_trang_thai_su_co> lich_su_trang_thai_su_cos { get; set; }

    public virtual DbSet<lien_ket_su_co> lien_ket_su_cos { get; set; }

    public virtual DbSet<lo_hang> lo_hangs { get; set; }

    public virtual DbSet<loai_kho> loai_khos { get; set; }

    public virtual DbSet<loai_phuong_tien> loai_phuong_tiens { get; set; }

    public virtual DbSet<loai_su_co> loai_su_cos { get; set; }

    public virtual DbSet<ly_do> ly_dos { get; set; }

    public virtual DbSet<mat_hang> mat_hangs { get; set; }

    public virtual DbSet<muc_do_nghiem_trong> muc_do_nghiem_trongs { get; set; }

    public virtual DbSet<muc_do_uu_tien> muc_do_uu_tiens { get; set; }

    public virtual DbSet<nang_luc_phuong_tien> nang_luc_phuong_tiens { get; set; }

    public virtual DbSet<nguoi_dung> nguoi_dungs { get; set; }

    public virtual DbSet<nguoi_dung_vai_tro> nguoi_dung_vai_tros { get; set; }

    public virtual DbSet<nguoi_nhan_thong_bao> nguoi_nhan_thong_baos { get; set; }

    public virtual DbSet<nhat_ky_dang_nhap> nhat_ky_dang_nhaps { get; set; }

    public virtual DbSet<nhat_ky_he_thong> nhat_ky_he_thongs { get; set; }

    public virtual DbSet<nhiem_vu_cuu_ho> nhiem_vu_cuu_hos { get; set; }

    public virtual DbSet<nhom_mat_hang> nhom_mat_hangs { get; set; }

    public virtual DbSet<phan_cong_doi> phan_cong_dois { get; set; }

    public virtual DbSet<phan_cong_phuong_tien> phan_cong_phuong_tiens { get; set; }

    public virtual DbSet<phan_cong_thanh_vien> phan_cong_thanh_viens { get; set; }

    public virtual DbSet<phat_cuu_tro> phat_cuu_tros { get; set; }

    public virtual DbSet<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_tros { get; set; }

    public virtual DbSet<phieu_kho> phieu_khos { get; set; }

    public virtual DbSet<phuong_tien> phuong_tiens { get; set; }

    public virtual DbSet<phuong_tien_nang_luc> phuong_tien_nang_lucs { get; set; }

    public virtual DbSet<quyen> quyens { get; set; }

    public virtual DbSet<scene_factor_def> scene_factor_defs { get; set; }

    public virtual DbSet<su_co> su_cos { get; set; }

    public virtual DbSet<tep_tin> tep_tins { get; set; }

    public virtual DbSet<tep_tin_su_co> tep_tin_su_cos { get; set; }

    public virtual DbSet<thanh_vien_doi> thanh_vien_dois { get; set; }

    public virtual DbSet<thong_bao> thong_baos { get; set; }

    public virtual DbSet<thong_so_he_thong> thong_so_he_thongs { get; set; }

    public virtual DbSet<tinh_trang_hien_truong> tinh_trang_hien_truongs { get; set; }

    public virtual DbSet<to_chuc> to_chucs { get; set; }

    public virtual DbSet<ton_kho> ton_khos { get; set; }

    public virtual DbSet<vai_tro> vai_tros { get; set; }

    public virtual DbSet<vai_tro_quyen> vai_tro_quyens { get; set; }

    public virtual DbSet<vi_tri_kho> vi_tri_khos { get; set; }

    public virtual DbSet<vi_tri_su_co> vi_tri_su_cos { get; set; }

    public virtual DbSet<vung_phu_trach> vung_phu_traches { get; set; }

    public virtual DbSet<workflow_process> workflow_processes { get; set; }

    public virtual DbSet<workflow_state> workflow_states { get; set; }

    public virtual DbSet<workflow_transition> workflow_transitions { get; set; }

    public virtual DbSet<xac_nhan_duoc_cuu> xac_nhan_duoc_cuus { get; set; }

    public virtual DbSet<xac_nhan_nhan_cuu_tro> xac_nhan_nhan_cuu_tros { get; set; }

    public virtual DbSet<yeu_cau_chi_vien> yeu_cau_chi_viens { get; set; }

    public virtual DbSet<yeu_cau_cuu_tro> yeu_cau_cuu_tros { get; set; }

    public virtual DbSet<yeu_cau_huy_nhiem_vu> yeu_cau_huy_nhiem_vus { get; set; }

    public virtual DbSet<yeu_cau_ky_nang_su_co> yeu_cau_ky_nang_su_cos { get; set; }

    public virtual DbSet<yeu_cau_nang_luc_phuong_tien_su_co> yeu_cau_nang_luc_phuong_tien_su_cos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresExtension("pgcrypto")
            .HasPostgresExtension("postgis");

        modelBuilder.Entity<ai_goi_y>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ai_goi_y_pkey");

            entity.ToTable("ai_goi_y");

            entity.HasIndex(e => new { e.target_entity_type, e.target_entity_id }, "idx_ai_goi_y_target");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.approval_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");
            entity.Property(e => e.confidence_score).HasPrecision(5, 2);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.payload_json).HasColumnType("jsonb");
            entity.Property(e => e.suggestion_type_code).HasMaxLength(50);
            entity.Property(e => e.target_entity_type).HasMaxLength(50);

            entity.HasOne(d => d.ai_nhiem_vu).WithMany(p => p.ai_goi_ies)
                .HasForeignKey(d => d.ai_nhiem_vu_id)
                .HasConstraintName("ai_goi_y_ai_nhiem_vu_id_fkey");

            entity.HasOne(d => d.approved_byNavigation).WithMany(p => p.ai_goi_ies)
                .HasForeignKey(d => d.approved_by)
                .HasConstraintName("ai_goi_y_approved_by_fkey");
        });

        modelBuilder.Entity<ai_nhiem_vu>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ai_nhiem_vu_pkey");

            entity.ToTable("ai_nhiem_vu");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.entity_type).HasMaxLength(50);
            entity.Property(e => e.input_hash).HasMaxLength(255);
            entity.Property(e => e.job_type_code).HasMaxLength(50);
            entity.Property(e => e.model_name).HasMaxLength(100);
            entity.Property(e => e.provider_name).HasMaxLength(100);
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");

            entity.HasOne(d => d.requested_byNavigation).WithMany(p => p.ai_nhiem_vus)
                .HasForeignKey(d => d.requested_by)
                .HasConstraintName("ai_nhiem_vu_requested_by_fkey");
        });

        modelBuilder.Entity<bao_cao_hien_truong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("bao_cao_hien_truong_pkey");

            entity.ToTable("bao_cao_hien_truong");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.report_type_code).HasMaxLength(50);
            entity.Property(e => e.reported_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.bao_cao_hien_truongs)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("bao_cao_hien_truong_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.reported_byNavigation).WithMany(p => p.bao_cao_hien_truongs)
                .HasForeignKey(d => d.reported_by)
                .HasConstraintName("bao_cao_hien_truong_reported_by_fkey");
        });

        modelBuilder.Entity<bao_cao_hien_truong_tep_tin>(entity =>
        {
            entity.HasKey(e => e.id).HasName("bao_cao_hien_truong_tep_tin_pkey");

            entity.ToTable("bao_cao_hien_truong_tep_tin");

            entity.HasIndex(e => new { e.bao_cao_hien_truong_id, e.tep_tin_id }, "bao_cao_hien_truong_tep_tin_bao_cao_hien_truong_id_tep_tin__key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.bao_cao_hien_truong).WithMany(p => p.bao_cao_hien_truong_tep_tins)
                .HasForeignKey(d => d.bao_cao_hien_truong_id)
                .HasConstraintName("bao_cao_hien_truong_tep_tin_bao_cao_hien_truong_id_fkey");

            entity.HasOne(d => d.tep_tin).WithMany(p => p.bao_cao_hien_truong_tep_tins)
                .HasForeignKey(d => d.tep_tin_id)
                .HasConstraintName("bao_cao_hien_truong_tep_tin_tep_tin_id_fkey");
        });

        modelBuilder.Entity<canh_bao_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("canh_bao_kho_pkey");

            entity.ToTable("canh_bao_kho");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.alert_type_code).HasMaxLength(50);
            entity.Property(e => e.detected_at).HasDefaultValueSql("now()");
            entity.Property(e => e.severity_code).HasMaxLength(50);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'OPEN'::character varying");

            entity.HasOne(d => d.kho).WithMany(p => p.canh_bao_khos)
                .HasForeignKey(d => d.kho_id)
                .HasConstraintName("canh_bao_kho_kho_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.canh_bao_khos)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("canh_bao_kho_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.canh_bao_khos)
                .HasForeignKey(d => d.mat_hang_id)
                .HasConstraintName("canh_bao_kho_mat_hang_id_fkey");
        });

        modelBuilder.Entity<cap_do_ky_nang>(entity =>
        {
            entity.HasKey(e => e.id).HasName("cap_do_ky_nang_pkey");

            entity.ToTable("cap_do_ky_nang");

            entity.HasIndex(e => e.code, "cap_do_ky_nang_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.rank_order).HasDefaultValue(0);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<chi_tiet_cap_phat_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_cap_phat_cuu_tro_pkey");

            entity.ToTable("chi_tiet_cap_phat_cuu_tro");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.issue_qty).HasPrecision(18, 4);
            entity.Property(e => e.received_qty).HasPrecision(18, 4);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_cap_phat_cuu_tros)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_cap_phat_cuu_tro_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.chi_tiet_cap_phat_cuu_tros)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("chi_tiet_cap_phat_cuu_tro_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.chi_tiet_cap_phat_cuu_tros)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chi_tiet_cap_phat_cuu_tro_mat_hang_id_fkey");

            entity.HasOne(d => d.phieu_cap_phat_cuu_tro).WithMany(p => p.chi_tiet_cap_phat_cuu_tros)
                .HasForeignKey(d => d.phieu_cap_phat_cuu_tro_id)
                .HasConstraintName("chi_tiet_cap_phat_cuu_tro_phieu_cap_phat_cuu_tro_id_fkey");

            entity.HasOne(d => d.source_phieu_kho_line).WithMany(p => p.chi_tiet_cap_phat_cuu_tros)
                .HasForeignKey(d => d.source_phieu_kho_line_id)
                .HasConstraintName("chi_tiet_cap_phat_cuu_tro_source_phieu_kho_line_id_fkey");
        });

        modelBuilder.Entity<chi_tiet_dieu_chuyen_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_dieu_chuyen_kho_pkey");

            entity.ToTable("chi_tiet_dieu_chuyen_kho");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.allocated_qty).HasPrecision(18, 4);
            entity.Property(e => e.received_qty).HasPrecision(18, 4);
            entity.Property(e => e.requested_qty).HasPrecision(18, 4);
            entity.Property(e => e.shipped_qty).HasPrecision(18, 4);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_dieu_chuyen_khos)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_dieu_chuyen_kho_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.lenh_dieu_chuyen_kho).WithMany(p => p.chi_tiet_dieu_chuyen_khos)
                .HasForeignKey(d => d.lenh_dieu_chuyen_kho_id)
                .HasConstraintName("chi_tiet_dieu_chuyen_kho_lenh_dieu_chuyen_kho_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.chi_tiet_dieu_chuyen_khos)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("chi_tiet_dieu_chuyen_kho_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.chi_tiet_dieu_chuyen_khos)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chi_tiet_dieu_chuyen_kho_mat_hang_id_fkey");
        });

        modelBuilder.Entity<chi_tiet_hien_truong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_hien_truong_pkey");

            entity.ToTable("chi_tiet_hien_truong");

            entity.HasIndex(e => new { e.tinh_trang_hien_truong_id, e.scene_factor_def_id }, "chi_tiet_hien_truong_tinh_trang_hien_truong_id_scene_factor_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.option_code).HasMaxLength(50);
            entity.Property(e => e.value_json).HasColumnType("jsonb");
            entity.Property(e => e.value_number).HasPrecision(18, 4);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_hien_truongs)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_hien_truong_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.scene_factor_def).WithMany(p => p.chi_tiet_hien_truongs)
                .HasForeignKey(d => d.scene_factor_def_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chi_tiet_hien_truong_scene_factor_def_id_fkey");

            entity.HasOne(d => d.tinh_trang_hien_truong).WithMany(p => p.chi_tiet_hien_truongs)
                .HasForeignKey(d => d.tinh_trang_hien_truong_id)
                .HasConstraintName("chi_tiet_hien_truong_tinh_trang_hien_truong_id_fkey");
        });

        modelBuilder.Entity<chi_tiet_phat_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_phat_cuu_tro_pkey");

            entity.ToTable("chi_tiet_phat_cuu_tro");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.qty).HasPrecision(18, 4);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_phat_cuu_tros)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_phat_cuu_tro_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.chi_tiet_phat_cuu_tros)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("chi_tiet_phat_cuu_tro_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.chi_tiet_phat_cuu_tros)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chi_tiet_phat_cuu_tro_mat_hang_id_fkey");

            entity.HasOne(d => d.phat_cuu_tro).WithMany(p => p.chi_tiet_phat_cuu_tros)
                .HasForeignKey(d => d.phat_cuu_tro_id)
                .HasConstraintName("chi_tiet_phat_cuu_tro_phat_cuu_tro_id_fkey");

            entity.HasOne(d => d.source_issue_line).WithMany(p => p.chi_tiet_phat_cuu_tros)
                .HasForeignKey(d => d.source_issue_line_id)
                .HasConstraintName("chi_tiet_phat_cuu_tro_source_issue_line_id_fkey");
        });

        modelBuilder.Entity<chi_tiet_phieu_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_phieu_kho_pkey");

            entity.ToTable("chi_tiet_phieu_kho");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.donor_snapshot).HasMaxLength(255);
            entity.Property(e => e.qty).HasPrecision(18, 4);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_phieu_khos)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_phieu_kho_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.from_vi_tri_kho).WithMany(p => p.chi_tiet_phieu_khofrom_vi_tri_khos)
                .HasForeignKey(d => d.from_vi_tri_kho_id)
                .HasConstraintName("chi_tiet_phieu_kho_from_vi_tri_kho_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.chi_tiet_phieu_khos)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("chi_tiet_phieu_kho_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.chi_tiet_phieu_khos)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chi_tiet_phieu_kho_mat_hang_id_fkey");

            entity.HasOne(d => d.phieu_kho).WithMany(p => p.chi_tiet_phieu_khos)
                .HasForeignKey(d => d.phieu_kho_id)
                .HasConstraintName("chi_tiet_phieu_kho_phieu_kho_id_fkey");

            entity.HasOne(d => d.to_vi_tri_kho).WithMany(p => p.chi_tiet_phieu_khoto_vi_tri_khos)
                .HasForeignKey(d => d.to_vi_tri_kho_id)
                .HasConstraintName("chi_tiet_phieu_kho_to_vi_tri_kho_id_fkey");
        });

        modelBuilder.Entity<chi_tiet_yeu_cau_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chi_tiet_yeu_cau_cuu_tro_pkey");

            entity.ToTable("chi_tiet_yeu_cau_cuu_tro");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.approved_qty).HasPrecision(18, 4);
            entity.Property(e => e.fulfilled_qty).HasPrecision(18, 4);
            entity.Property(e => e.requested_qty).HasPrecision(18, 4);
            entity.Property(e => e.support_type_code).HasMaxLength(50);

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.chi_tiet_yeu_cau_cuu_tros)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("chi_tiet_yeu_cau_cuu_tro_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.chi_tiet_yeu_cau_cuu_tros)
                .HasForeignKey(d => d.mat_hang_id)
                .HasConstraintName("chi_tiet_yeu_cau_cuu_tro_mat_hang_id_fkey");

            entity.HasOne(d => d.yeu_cau_cuu_tro).WithMany(p => p.chi_tiet_yeu_cau_cuu_tros)
                .HasForeignKey(d => d.yeu_cau_cuu_tro_id)
                .HasConstraintName("chi_tiet_yeu_cau_cuu_tro_yeu_cau_cuu_tro_id_fkey");
        });

        modelBuilder.Entity<chien_dich_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chien_dich_cuu_tro_pkey");

            entity.ToTable("chien_dich_cuu_tro");

            entity.HasIndex(e => e.campaign_code, "chien_dich_cuu_tro_campaign_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.campaign_code).HasMaxLength(50);
            entity.Property(e => e.campaign_name).HasMaxLength(255);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.responsible_don_vi).WithMany(p => p.chien_dich_cuu_tros)
                .HasForeignKey(d => d.responsible_don_vi_id)
                .HasConstraintName("chien_dich_cuu_tro_responsible_don_vi_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.chien_dich_cuu_tros)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("chien_dich_cuu_tro_su_co_id_fkey");

            entity.HasOne(d => d.target_khu_vuc).WithMany(p => p.chien_dich_cuu_tros)
                .HasForeignKey(d => d.target_khu_vuc_id)
                .HasConstraintName("chien_dich_cuu_tro_target_khu_vuc_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.chien_dich_cuu_tros)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("chien_dich_cuu_tro_workflow_state_id_fkey");
        });

        modelBuilder.Entity<chinh_sach_xuat_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chinh_sach_xuat_kho_pkey");

            entity.ToTable("chinh_sach_xuat_kho");

            entity.HasIndex(e => e.code, "chinh_sach_xuat_kho_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<chung_chi>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chung_chi_pkey");

            entity.ToTable("chung_chi");

            entity.HasIndex(e => e.code, "chung_chi_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<chung_chi_thanh_vien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("chung_chi_thanh_vien_pkey");

            entity.ToTable("chung_chi_thanh_vien");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.cert_no).HasMaxLength(100);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chung_chi).WithMany(p => p.chung_chi_thanh_viens)
                .HasForeignKey(d => d.chung_chi_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("chung_chi_thanh_vien_chung_chi_id_fkey");

            entity.HasOne(d => d.tep_tin).WithMany(p => p.chung_chi_thanh_viens)
                .HasForeignKey(d => d.tep_tin_id)
                .HasConstraintName("chung_chi_thanh_vien_tep_tin_id_fkey");

            entity.HasOne(d => d.thanh_vien_doi).WithMany(p => p.chung_chi_thanh_viens)
                .HasForeignKey(d => d.thanh_vien_doi_id)
                .HasConstraintName("chung_chi_thanh_vien_thanh_vien_doi_id_fkey");
        });

        modelBuilder.Entity<cong_dan>(entity =>
        {
            entity.HasKey(e => e.id).HasName("cong_dan_pkey");

            entity.ToTable("cong_dan");

            entity.HasIndex(e => e.nguoi_dung_id, "cong_dan_nguoi_dung_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.full_name).HasMaxLength(255);
            entity.Property(e => e.gender_code).HasMaxLength(30);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.nguoi_dung).WithOne(p => p.cong_dan)
                .HasForeignKey<cong_dan>(d => d.nguoi_dung_id)
                .HasConstraintName("cong_dan_nguoi_dung_id_fkey");
        });

        modelBuilder.Entity<danh_gia_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("danh_gia_su_co_pkey");

            entity.ToTable("danh_gia_su_co");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.access_difficulty_code).HasMaxLength(50);
            entity.Property(e => e.assessed_at).HasDefaultValueSql("now()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.requires_evacuation).HasDefaultValue(false);
            entity.Property(e => e.requires_medical_support).HasDefaultValue(false);

            entity.HasOne(d => d.assessed_byNavigation).WithMany(p => p.danh_gia_su_cos)
                .HasForeignKey(d => d.assessed_by)
                .HasConstraintName("danh_gia_su_co_assessed_by_fkey");

            entity.HasOne(d => d.muc_do_nghiem_trong).WithMany(p => p.danh_gia_su_cos)
                .HasForeignKey(d => d.muc_do_nghiem_trong_id)
                .HasConstraintName("danh_gia_su_co_muc_do_nghiem_trong_id_fkey");

            entity.HasOne(d => d.muc_do_uu_tien).WithMany(p => p.danh_gia_su_cos)
                .HasForeignKey(d => d.muc_do_uu_tien_id)
                .HasConstraintName("danh_gia_su_co_muc_do_uu_tien_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.danh_gia_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("danh_gia_su_co_su_co_id_fkey");
        });

        modelBuilder.Entity<dat_cho_ton_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("dat_cho_ton_kho_pkey");

            entity.ToTable("dat_cho_ton_kho");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.reference_type).HasMaxLength(50);
            entity.Property(e => e.reserved_at).HasDefaultValueSql("now()");
            entity.Property(e => e.reserved_qty).HasPrecision(18, 4);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'ACTIVE'::character varying");

            entity.HasOne(d => d.kho).WithMany(p => p.dat_cho_ton_khos)
                .HasForeignKey(d => d.kho_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("dat_cho_ton_kho_kho_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.dat_cho_ton_khos)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("dat_cho_ton_kho_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.dat_cho_ton_khos)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("dat_cho_ton_kho_mat_hang_id_fkey");

            entity.HasOne(d => d.vi_tri_kho).WithMany(p => p.dat_cho_ton_khos)
                .HasForeignKey(d => d.vi_tri_kho_id)
                .HasConstraintName("dat_cho_ton_kho_vi_tri_kho_id_fkey");
        });

        modelBuilder.Entity<dia_diem>(entity =>
        {
            entity.HasKey(e => e.id).HasName("dia_diem_pkey");

            entity.ToTable("dia_diem");

            entity.HasIndex(e => e.code, "dia_diem_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.lat).HasPrecision(10, 7);
            entity.Property(e => e.lng).HasPrecision(10, 7);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.site_type_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.khu_vuc_hanh_chinh).WithMany(p => p.dia_diems)
                .HasForeignKey(d => d.khu_vuc_hanh_chinh_id)
                .HasConstraintName("dia_diem_khu_vuc_hanh_chinh_id_fkey");

            entity.HasOne(d => d.responsible_don_vi).WithMany(p => p.dia_diems)
                .HasForeignKey(d => d.responsible_don_vi_id)
                .HasConstraintName("dia_diem_responsible_don_vi_id_fkey");
        });

        modelBuilder.Entity<diem_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("diem_cuu_tro_pkey");

            entity.ToTable("diem_cuu_tro");

            entity.HasIndex(e => new { e.chien_dich_cuu_tro_id, e.point_code }, "diem_cuu_tro_chien_dich_cuu_tro_id_point_code_key").IsUnique();

            entity.HasIndex(e => e.geom, "idx_diem_cuu_tro_geom").HasMethod("gist");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.lat).HasPrecision(10, 7);
            entity.Property(e => e.lng).HasPrecision(10, 7);
            entity.Property(e => e.point_code).HasMaxLength(50);
            entity.Property(e => e.point_name).HasMaxLength(255);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'OPEN'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chien_dich_cuu_tro).WithMany(p => p.diem_cuu_tros)
                .HasForeignKey(d => d.chien_dich_cuu_tro_id)
                .HasConstraintName("diem_cuu_tro_chien_dich_cuu_tro_id_fkey");

            entity.HasOne(d => d.dia_diem).WithMany(p => p.diem_cuu_tros)
                .HasForeignKey(d => d.dia_diem_id)
                .HasConstraintName("diem_cuu_tro_dia_diem_id_fkey");

            entity.HasOne(d => d.khu_vuc_hanh_chinh).WithMany(p => p.diem_cuu_tros)
                .HasForeignKey(d => d.khu_vuc_hanh_chinh_id)
                .HasConstraintName("diem_cuu_tro_khu_vuc_hanh_chinh_id_fkey");

            entity.HasOne(d => d.manager_user).WithMany(p => p.diem_cuu_tros)
                .HasForeignKey(d => d.manager_user_id)
                .HasConstraintName("diem_cuu_tro_manager_user_id_fkey");
        });

        modelBuilder.Entity<doi_cuu_ho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("doi_cuu_ho_pkey");

            entity.ToTable("doi_cuu_ho");

            entity.HasIndex(e => e.team_code, "doi_cuu_ho_team_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.max_parallel_mission).HasDefaultValue(1);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'AVAILABLE'::character varying");
            entity.Property(e => e.team_code).HasMaxLength(50);
            entity.Property(e => e.team_name).HasMaxLength(255);
            entity.Property(e => e.team_type_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.home_dia_diem).WithMany(p => p.doi_cuu_hos)
                .HasForeignKey(d => d.home_dia_diem_id)
                .HasConstraintName("doi_cuu_ho_home_dia_diem_id_fkey");

            entity.HasOne(d => d.leader_user).WithMany(p => p.doi_cuu_hos)
                .HasForeignKey(d => d.leader_user_id)
                .HasConstraintName("doi_cuu_ho_leader_user_id_fkey");

            entity.HasOne(d => d.responsible_vung).WithMany(p => p.doi_cuu_hos)
                .HasForeignKey(d => d.responsible_vung_id)
                .HasConstraintName("doi_cuu_ho_responsible_vung_id_fkey");
        });

        modelBuilder.Entity<doi_phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("doi_phuong_tien_pkey");

            entity.ToTable("doi_phuong_tien");

            entity.HasIndex(e => new { e.doi_cuu_ho_id, e.phuong_tien_id, e.effective_from }, "doi_phuong_tien_doi_cuu_ho_id_phuong_tien_id_effective_from_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.effective_from).HasDefaultValueSql("now()");

            entity.HasOne(d => d.doi_cuu_ho).WithMany(p => p.doi_phuong_tiens)
                .HasForeignKey(d => d.doi_cuu_ho_id)
                .HasConstraintName("doi_phuong_tien_doi_cuu_ho_id_fkey");

            entity.HasOne(d => d.phuong_tien).WithMany(p => p.doi_phuong_tiens)
                .HasForeignKey(d => d.phuong_tien_id)
                .HasConstraintName("doi_phuong_tien_phuong_tien_id_fkey");
        });

        modelBuilder.Entity<don_vi>(entity =>
        {
            entity.HasKey(e => e.id).HasName("don_vi_pkey");

            entity.ToTable("don_vi");

            entity.HasIndex(e => e.code, "don_vi_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.parent).WithMany(p => p.Inverseparent)
                .HasForeignKey(d => d.parent_id)
                .HasConstraintName("don_vi_parent_id_fkey");

            entity.HasOne(d => d.to_chuc).WithMany(p => p.don_vis)
                .HasForeignKey(d => d.to_chuc_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("don_vi_to_chuc_id_fkey");
        });

        modelBuilder.Entity<don_vi_tinh>(entity =>
        {
            entity.HasKey(e => e.id).HasName("don_vi_tinh_pkey");

            entity.ToTable("don_vi_tinh");

            entity.HasIndex(e => e.code, "don_vi_tinh_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.symbol).HasMaxLength(20);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ho_dan>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ho_dan_pkey");

            entity.ToTable("ho_dan");

            entity.HasIndex(e => e.household_code, "ho_dan_household_code_key").IsUnique();

            entity.HasIndex(e => e.geom, "idx_ho_dan_geom").HasMethod("gist");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.head_name).HasMaxLength(255);
            entity.Property(e => e.household_code).HasMaxLength(50);
            entity.Property(e => e.lat).HasPrecision(10, 7);
            entity.Property(e => e.lng).HasPrecision(10, 7);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.cong_dan).WithMany(p => p.ho_dans)
                .HasForeignKey(d => d.cong_dan_id)
                .HasConstraintName("ho_dan_cong_dan_id_fkey");

            entity.HasOne(d => d.khu_vuc_hanh_chinh).WithMany(p => p.ho_dans)
                .HasForeignKey(d => d.khu_vuc_hanh_chinh_id)
                .HasConstraintName("ho_dan_khu_vuc_hanh_chinh_id_fkey");
        });

        modelBuilder.Entity<incident_type_scene_factor>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_type_scene_factors_pkey");

            entity.HasIndex(e => new { e.loai_su_co_id, e.scene_factor_def_id }, "incident_type_scene_factors_loai_su_co_id_scene_factor_def__key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_required).HasDefaultValue(false);
            entity.Property(e => e.sort_order).HasDefaultValue(0);

            entity.HasOne(d => d.loai_su_co).WithMany(p => p.incident_type_scene_factors)
                .HasForeignKey(d => d.loai_su_co_id)
                .HasConstraintName("incident_type_scene_factors_loai_su_co_id_fkey");

            entity.HasOne(d => d.scene_factor_def).WithMany(p => p.incident_type_scene_factors)
                .HasForeignKey(d => d.scene_factor_def_id)
                .HasConstraintName("incident_type_scene_factors_scene_factor_def_id_fkey");
        });

        modelBuilder.Entity<kenh_tiep_nhan>(entity =>
        {
            entity.HasKey(e => e.id).HasName("kenh_tiep_nhan_pkey");

            entity.ToTable("kenh_tiep_nhan");

            entity.HasIndex(e => e.code, "kenh_tiep_nhan_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("kho_pkey");

            entity.ToTable("kho");

            entity.HasIndex(e => e.warehouse_code, "kho_warehouse_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'ACTIVE'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.warehouse_code).HasMaxLength(50);
            entity.Property(e => e.warehouse_name).HasMaxLength(255);

            entity.HasOne(d => d.dia_diem).WithMany(p => p.khos)
                .HasForeignKey(d => d.dia_diem_id)
                .HasConstraintName("kho_dia_diem_id_fkey");

            entity.HasOne(d => d.loai_kho).WithMany(p => p.khos)
                .HasForeignKey(d => d.loai_kho_id)
                .HasConstraintName("kho_loai_kho_id_fkey");

            entity.HasOne(d => d.manager_user).WithMany(p => p.khos)
                .HasForeignKey(d => d.manager_user_id)
                .HasConstraintName("kho_manager_user_id_fkey");
        });

        modelBuilder.Entity<khu_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("khu_kho_pkey");

            entity.ToTable("khu_kho");

            entity.HasIndex(e => new { e.kho_id, e.zone_code }, "khu_kho_kho_id_zone_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.zone_code).HasMaxLength(50);
            entity.Property(e => e.zone_name).HasMaxLength(255);
            entity.Property(e => e.zone_type_code).HasMaxLength(50);

            entity.HasOne(d => d.kho).WithMany(p => p.khu_khos)
                .HasForeignKey(d => d.kho_id)
                .HasConstraintName("khu_kho_kho_id_fkey");
        });

        modelBuilder.Entity<khu_vuc_hanh_chinh>(entity =>
        {
            entity.HasKey(e => e.id).HasName("khu_vuc_hanh_chinh_pkey");

            entity.ToTable("khu_vuc_hanh_chinh");

            entity.HasIndex(e => e.code, "khu_vuc_hanh_chinh_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(MultiPolygon,4326)");
            entity.Property(e => e.level_code).HasMaxLength(50);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.parent).WithMany(p => p.Inverseparent)
                .HasForeignKey(d => d.parent_id)
                .HasConstraintName("khu_vuc_hanh_chinh_parent_id_fkey");
        });

        modelBuilder.Entity<ky_nang>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ky_nang_pkey");

            entity.ToTable("ky_nang");

            entity.HasIndex(e => e.code, "ky_nang_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.skill_domain_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ky_nang_thanh_vien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ky_nang_thanh_vien_pkey");

            entity.ToTable("ky_nang_thanh_vien");

            entity.HasIndex(e => new { e.ky_nang_id, e.cap_do_ky_nang_id }, "idx_ky_nang_thanh_vien_skill_level");

            entity.HasIndex(e => new { e.thanh_vien_doi_id, e.ky_nang_id }, "ky_nang_thanh_vien_thanh_vien_doi_id_ky_nang_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_primary_skill).HasDefaultValue(false);

            entity.HasOne(d => d.cap_do_ky_nang).WithMany(p => p.ky_nang_thanh_viens)
                .HasForeignKey(d => d.cap_do_ky_nang_id)
                .HasConstraintName("ky_nang_thanh_vien_cap_do_ky_nang_id_fkey");

            entity.HasOne(d => d.ky_nang).WithMany(p => p.ky_nang_thanh_viens)
                .HasForeignKey(d => d.ky_nang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ky_nang_thanh_vien_ky_nang_id_fkey");

            entity.HasOne(d => d.thanh_vien_doi).WithMany(p => p.ky_nang_thanh_viens)
                .HasForeignKey(d => d.thanh_vien_doi_id)
                .HasConstraintName("ky_nang_thanh_vien_thanh_vien_doi_id_fkey");

            entity.HasOne(d => d.verified_byNavigation).WithMany(p => p.ky_nang_thanh_viens)
                .HasForeignKey(d => d.verified_by)
                .HasConstraintName("ky_nang_thanh_vien_verified_by_fkey");
        });

        modelBuilder.Entity<lenh_dieu_chuyen_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lenh_dieu_chuyen_kho_pkey");

            entity.ToTable("lenh_dieu_chuyen_kho");

            entity.HasIndex(e => e.transfer_code, "lenh_dieu_chuyen_kho_transfer_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.transfer_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.approved_byNavigation).WithMany(p => p.lenh_dieu_chuyen_khoapproved_byNavigations)
                .HasForeignKey(d => d.approved_by)
                .HasConstraintName("lenh_dieu_chuyen_kho_approved_by_fkey");

            entity.HasOne(d => d.from_kho).WithMany(p => p.lenh_dieu_chuyen_khofrom_khos)
                .HasForeignKey(d => d.from_kho_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("lenh_dieu_chuyen_kho_from_kho_id_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.lenh_dieu_chuyen_khos)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lenh_dieu_chuyen_kho_ly_do_id_fkey");

            entity.HasOne(d => d.requested_byNavigation).WithMany(p => p.lenh_dieu_chuyen_khorequested_byNavigations)
                .HasForeignKey(d => d.requested_by)
                .HasConstraintName("lenh_dieu_chuyen_kho_requested_by_fkey");

            entity.HasOne(d => d.to_kho).WithMany(p => p.lenh_dieu_chuyen_khoto_khos)
                .HasForeignKey(d => d.to_kho_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("lenh_dieu_chuyen_kho_to_kho_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.lenh_dieu_chuyen_khos)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("lenh_dieu_chuyen_kho_workflow_state_id_fkey");
        });

        modelBuilder.Entity<lich_su_chuyen_doi>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lich_su_chuyen_doi_pkey");

            entity.ToTable("lich_su_chuyen_doi");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.transferred_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.from_doi_cuu_ho).WithMany(p => p.lich_su_chuyen_doifrom_doi_cuu_hos)
                .HasForeignKey(d => d.from_doi_cuu_ho_id)
                .HasConstraintName("lich_su_chuyen_doi_from_doi_cuu_ho_id_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.lich_su_chuyen_dois)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lich_su_chuyen_doi_ly_do_id_fkey");

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.lich_su_chuyen_dois)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("lich_su_chuyen_doi_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.to_doi_cuu_ho).WithMany(p => p.lich_su_chuyen_doito_doi_cuu_hos)
                .HasForeignKey(d => d.to_doi_cuu_ho_id)
                .HasConstraintName("lich_su_chuyen_doi_to_doi_cuu_ho_id_fkey");

            entity.HasOne(d => d.transferred_byNavigation).WithMany(p => p.lich_su_chuyen_dois)
                .HasForeignKey(d => d.transferred_by)
                .HasConstraintName("lich_su_chuyen_doi_transferred_by_fkey");
        });

        modelBuilder.Entity<lich_su_san_sang_thanh_vien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lich_su_san_sang_thanh_vien_pkey");

            entity.ToTable("lich_su_san_sang_thanh_vien");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status_code).HasMaxLength(50);

            entity.HasOne(d => d.ly_do).WithMany(p => p.lich_su_san_sang_thanh_viens)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lich_su_san_sang_thanh_vien_ly_do_id_fkey");

            entity.HasOne(d => d.thanh_vien_doi).WithMany(p => p.lich_su_san_sang_thanh_viens)
                .HasForeignKey(d => d.thanh_vien_doi_id)
                .HasConstraintName("lich_su_san_sang_thanh_vien_thanh_vien_doi_id_fkey");
        });

        modelBuilder.Entity<lich_su_trang_thai_nhiem_vu>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lich_su_trang_thai_nhiem_vu_pkey");

            entity.ToTable("lich_su_trang_thai_nhiem_vu");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.action_code).HasMaxLength(50);
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.changed_byNavigation).WithMany(p => p.lich_su_trang_thai_nhiem_vus)
                .HasForeignKey(d => d.changed_by)
                .HasConstraintName("lich_su_trang_thai_nhiem_vu_changed_by_fkey");

            entity.HasOne(d => d.from_state).WithMany(p => p.lich_su_trang_thai_nhiem_vufrom_states)
                .HasForeignKey(d => d.from_state_id)
                .HasConstraintName("lich_su_trang_thai_nhiem_vu_from_state_id_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.lich_su_trang_thai_nhiem_vus)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lich_su_trang_thai_nhiem_vu_ly_do_id_fkey");

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.lich_su_trang_thai_nhiem_vus)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("lich_su_trang_thai_nhiem_vu_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.to_state).WithMany(p => p.lich_su_trang_thai_nhiem_vuto_states)
                .HasForeignKey(d => d.to_state_id)
                .HasConstraintName("lich_su_trang_thai_nhiem_vu_to_state_id_fkey");
        });

        modelBuilder.Entity<lich_su_trang_thai_phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lich_su_trang_thai_phuong_tien_pkey");

            entity.ToTable("lich_su_trang_thai_phuong_tien");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");
            entity.Property(e => e.from_status_code).HasMaxLength(50);
            entity.Property(e => e.to_status_code).HasMaxLength(50);

            entity.HasOne(d => d.changed_byNavigation).WithMany(p => p.lich_su_trang_thai_phuong_tiens)
                .HasForeignKey(d => d.changed_by)
                .HasConstraintName("lich_su_trang_thai_phuong_tien_changed_by_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.lich_su_trang_thai_phuong_tiens)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lich_su_trang_thai_phuong_tien_ly_do_id_fkey");

            entity.HasOne(d => d.phuong_tien).WithMany(p => p.lich_su_trang_thai_phuong_tiens)
                .HasForeignKey(d => d.phuong_tien_id)
                .HasConstraintName("lich_su_trang_thai_phuong_tien_phuong_tien_id_fkey");
        });

        modelBuilder.Entity<lich_su_trang_thai_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lich_su_trang_thai_su_co_pkey");

            entity.ToTable("lich_su_trang_thai_su_co");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.action_code).HasMaxLength(50);
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.changed_byNavigation).WithMany(p => p.lich_su_trang_thai_su_cos)
                .HasForeignKey(d => d.changed_by)
                .HasConstraintName("lich_su_trang_thai_su_co_changed_by_fkey");

            entity.HasOne(d => d.from_state).WithMany(p => p.lich_su_trang_thai_su_cofrom_states)
                .HasForeignKey(d => d.from_state_id)
                .HasConstraintName("lich_su_trang_thai_su_co_from_state_id_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.lich_su_trang_thai_su_cos)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("lich_su_trang_thai_su_co_ly_do_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.lich_su_trang_thai_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("lich_su_trang_thai_su_co_su_co_id_fkey");

            entity.HasOne(d => d.to_state).WithMany(p => p.lich_su_trang_thai_su_coto_states)
                .HasForeignKey(d => d.to_state_id)
                .HasConstraintName("lich_su_trang_thai_su_co_to_state_id_fkey");
        });

        modelBuilder.Entity<lien_ket_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lien_ket_su_co_pkey");

            entity.ToTable("lien_ket_su_co");

            entity.HasIndex(e => new { e.source_su_co_id, e.target_su_co_id, e.link_type_code }, "lien_ket_su_co_source_su_co_id_target_su_co_id_link_type_co_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.confidence_score).HasPrecision(5, 2);
            entity.Property(e => e.link_type_code).HasMaxLength(50);
            entity.Property(e => e.linked_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.linked_byNavigation).WithMany(p => p.lien_ket_su_cos)
                .HasForeignKey(d => d.linked_by)
                .HasConstraintName("lien_ket_su_co_linked_by_fkey");

            entity.HasOne(d => d.source_su_co).WithMany(p => p.lien_ket_su_cosource_su_cos)
                .HasForeignKey(d => d.source_su_co_id)
                .HasConstraintName("lien_ket_su_co_source_su_co_id_fkey");

            entity.HasOne(d => d.target_su_co).WithMany(p => p.lien_ket_su_cotarget_su_cos)
                .HasForeignKey(d => d.target_su_co_id)
                .HasConstraintName("lien_ket_su_co_target_su_co_id_fkey");
        });

        modelBuilder.Entity<lo_hang>(entity =>
        {
            entity.HasKey(e => e.id).HasName("lo_hang_pkey");

            entity.ToTable("lo_hang");

            entity.HasIndex(e => new { e.mat_hang_id, e.exp_date }, "idx_lo_hang_exp_date");

            entity.HasIndex(e => new { e.mat_hang_id, e.lot_no }, "lo_hang_mat_hang_id_lot_no_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.donor_name).HasMaxLength(255);
            entity.Property(e => e.lot_no).HasMaxLength(100);
            entity.Property(e => e.quality_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'GOOD'::character varying");
            entity.Property(e => e.source_document_no).HasMaxLength(100);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.lo_hangs)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("lo_hang_mat_hang_id_fkey");
        });

        modelBuilder.Entity<loai_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("loai_kho_pkey");

            entity.ToTable("loai_kho");

            entity.HasIndex(e => e.code, "loai_kho_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<loai_phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("loai_phuong_tien_pkey");

            entity.ToTable("loai_phuong_tien");

            entity.HasIndex(e => e.code, "loai_phuong_tien_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.default_capacity_weight_kg).HasPrecision(12, 2);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.vehicle_group_code).HasMaxLength(50);
        });

        modelBuilder.Entity<loai_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("loai_su_co_pkey");

            entity.ToTable("loai_su_co");

            entity.HasIndex(e => e.code, "loai_su_co_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.category_code).HasMaxLength(50);
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.color_code).HasMaxLength(20);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.icon).HasMaxLength(100);
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.supports_sos).HasDefaultValue(true);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ly_do>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ly_do_pkey");

            entity.ToTable("ly_do");

            entity.HasIndex(e => e.code, "ly_do_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.reason_group).HasMaxLength(100);
            entity.Property(e => e.requires_note).HasDefaultValue(false);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<mat_hang>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mat_hang_pkey");

            entity.ToTable("mat_hang");

            entity.HasIndex(e => e.item_code, "mat_hang_item_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_relief_item).HasDefaultValue(true);
            entity.Property(e => e.item_code).HasMaxLength(50);
            entity.Property(e => e.item_name).HasMaxLength(255);
            entity.Property(e => e.max_stock_qty).HasPrecision(18, 4);
            entity.Property(e => e.min_stock_qty).HasPrecision(18, 4);
            entity.Property(e => e.requires_expiry_tracking).HasDefaultValue(true);
            entity.Property(e => e.requires_lot_tracking).HasDefaultValue(true);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chinh_sach_xuat_kho).WithMany(p => p.mat_hangs)
                .HasForeignKey(d => d.chinh_sach_xuat_kho_id)
                .HasConstraintName("mat_hang_chinh_sach_xuat_kho_id_fkey");

            entity.HasOne(d => d.don_vi_tinh).WithMany(p => p.mat_hangs)
                .HasForeignKey(d => d.don_vi_tinh_id)
                .HasConstraintName("mat_hang_don_vi_tinh_id_fkey");

            entity.HasOne(d => d.nhom_mat_hang).WithMany(p => p.mat_hangs)
                .HasForeignKey(d => d.nhom_mat_hang_id)
                .HasConstraintName("mat_hang_nhom_mat_hang_id_fkey");
        });

        modelBuilder.Entity<muc_do_nghiem_trong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("muc_do_nghiem_trong_pkey");

            entity.ToTable("muc_do_nghiem_trong");

            entity.HasIndex(e => e.code, "muc_do_nghiem_trong_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.color_code).HasMaxLength(20);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.sort_order).HasDefaultValue(0);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<muc_do_uu_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("muc_do_uu_tien_pkey");

            entity.ToTable("muc_do_uu_tien");

            entity.HasIndex(e => e.code, "muc_do_uu_tien_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.color_code).HasMaxLength(20);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.sort_order).HasDefaultValue(0);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<nang_luc_phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nang_luc_phuong_tien_pkey");

            entity.ToTable("nang_luc_phuong_tien");

            entity.HasIndex(e => e.code, "nang_luc_phuong_tien_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<nguoi_dung>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nguoi_dung_pkey");

            entity.ToTable("nguoi_dung");

            entity.HasIndex(e => e.email, "nguoi_dung_email_key").IsUnique();

            entity.HasIndex(e => e.phone, "nguoi_dung_phone_key").IsUnique();

            entity.HasIndex(e => e.username, "nguoi_dung_username_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.display_name).HasMaxLength(255);
            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.failed_login_count).HasDefaultValue(0);
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'ACTIVE'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.username).HasMaxLength(100);

            entity.HasOne(d => d.don_vi).WithMany(p => p.nguoi_dungs)
                .HasForeignKey(d => d.don_vi_id)
                .HasConstraintName("nguoi_dung_don_vi_id_fkey");

            entity.HasOne(d => d.to_chuc).WithMany(p => p.nguoi_dungs)
                .HasForeignKey(d => d.to_chuc_id)
                .HasConstraintName("nguoi_dung_to_chuc_id_fkey");
        });

        modelBuilder.Entity<nguoi_dung_vai_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nguoi_dung_vai_tro_pkey");

            entity.ToTable("nguoi_dung_vai_tro");

            entity.HasIndex(e => new { e.nguoi_dung_id, e.vai_tro_id, e.don_vi_id }, "nguoi_dung_vai_tro_nguoi_dung_id_vai_tro_id_don_vi_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.don_vi).WithMany(p => p.nguoi_dung_vai_tros)
                .HasForeignKey(d => d.don_vi_id)
                .HasConstraintName("nguoi_dung_vai_tro_don_vi_id_fkey");

            entity.HasOne(d => d.nguoi_dung).WithMany(p => p.nguoi_dung_vai_tros)
                .HasForeignKey(d => d.nguoi_dung_id)
                .HasConstraintName("nguoi_dung_vai_tro_nguoi_dung_id_fkey");

            entity.HasOne(d => d.vai_tro).WithMany(p => p.nguoi_dung_vai_tros)
                .HasForeignKey(d => d.vai_tro_id)
                .HasConstraintName("nguoi_dung_vai_tro_vai_tro_id_fkey");
        });

        modelBuilder.Entity<nguoi_nhan_thong_bao>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nguoi_nhan_thong_bao_pkey");

            entity.ToTable("nguoi_nhan_thong_bao");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.delivery_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");
            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.recipient_type_code).HasMaxLength(50);

            entity.HasOne(d => d.nguoi_dung).WithMany(p => p.nguoi_nhan_thong_baos)
                .HasForeignKey(d => d.nguoi_dung_id)
                .HasConstraintName("nguoi_nhan_thong_bao_nguoi_dung_id_fkey");

            entity.HasOne(d => d.thong_bao).WithMany(p => p.nguoi_nhan_thong_baos)
                .HasForeignKey(d => d.thong_bao_id)
                .HasConstraintName("nguoi_nhan_thong_bao_thong_bao_id_fkey");
        });

        modelBuilder.Entity<nhat_ky_dang_nhap>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nhat_ky_dang_nhap_pkey");

            entity.ToTable("nhat_ky_dang_nhap");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ip_address).HasMaxLength(100);
            entity.Property(e => e.login_at).HasDefaultValueSql("now()");
            entity.Property(e => e.result_status_code).HasMaxLength(50);

            entity.HasOne(d => d.nguoi_dung).WithMany(p => p.nhat_ky_dang_nhaps)
                .HasForeignKey(d => d.nguoi_dung_id)
                .HasConstraintName("nhat_ky_dang_nhap_nguoi_dung_id_fkey");
        });

        modelBuilder.Entity<nhat_ky_he_thong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nhat_ky_he_thong_pkey");

            entity.ToTable("nhat_ky_he_thong");

            entity.HasIndex(e => new { e.entity_type, e.entity_id, e.changed_at }, "idx_nhat_ky_he_thong_entity_changed_at").IsDescending(false, false, true);

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.action_code).HasMaxLength(50);
            entity.Property(e => e.after_json).HasColumnType("jsonb");
            entity.Property(e => e.before_json).HasColumnType("jsonb");
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");
            entity.Property(e => e.entity_type).HasMaxLength(50);
            entity.Property(e => e.ip_address).HasMaxLength(100);
            entity.Property(e => e.request_id).HasMaxLength(100);

            entity.HasOne(d => d.changed_byNavigation).WithMany(p => p.nhat_ky_he_thongs)
                .HasForeignKey(d => d.changed_by)
                .HasConstraintName("nhat_ky_he_thong_changed_by_fkey");
        });

        modelBuilder.Entity<nhiem_vu_cuu_ho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nhiem_vu_cuu_ho_pkey");

            entity.ToTable("nhiem_vu_cuu_ho");

            entity.HasIndex(e => new { e.su_co_id, e.workflow_state_id }, "idx_nhiem_vu_su_co_state");

            entity.HasIndex(e => e.mission_code, "nhiem_vu_cuu_ho_mission_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.mission_code).HasMaxLength(50);
            entity.Property(e => e.result_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.closed_byNavigation).WithMany(p => p.nhiem_vu_cuu_hoclosed_byNavigations)
                .HasForeignKey(d => d.closed_by)
                .HasConstraintName("nhiem_vu_cuu_ho_closed_by_fkey");

            entity.HasOne(d => d.coordinator_user).WithMany(p => p.nhiem_vu_cuu_hocoordinator_users)
                .HasForeignKey(d => d.coordinator_user_id)
                .HasConstraintName("nhiem_vu_cuu_ho_coordinator_user_id_fkey");

            entity.HasOne(d => d.muc_do_uu_tien).WithMany(p => p.nhiem_vu_cuu_hos)
                .HasForeignKey(d => d.muc_do_uu_tien_id)
                .HasConstraintName("nhiem_vu_cuu_ho_muc_do_uu_tien_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.nhiem_vu_cuu_hos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("nhiem_vu_cuu_ho_su_co_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.nhiem_vu_cuu_hos)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("nhiem_vu_cuu_ho_workflow_state_id_fkey");
        });

        modelBuilder.Entity<nhom_mat_hang>(entity =>
        {
            entity.HasKey(e => e.id).HasName("nhom_mat_hang_pkey");

            entity.ToTable("nhom_mat_hang");

            entity.HasIndex(e => e.code, "nhom_mat_hang_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.parent).WithMany(p => p.Inverseparent)
                .HasForeignKey(d => d.parent_id)
                .HasConstraintName("nhom_mat_hang_parent_id_fkey");
        });

        modelBuilder.Entity<phan_cong_doi>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phan_cong_doi_pkey");

            entity.ToTable("phan_cong_doi");

            entity.HasIndex(e => new { e.doi_cuu_ho_id, e.response_status_code }, "idx_phan_cong_doi_team_response");

            entity.HasIndex(e => new { e.nhiem_vu_cuu_ho_id, e.doi_cuu_ho_id }, "phan_cong_doi_nhiem_vu_cuu_ho_id_doi_cuu_ho_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.assigned_at).HasDefaultValueSql("now()");
            entity.Property(e => e.assignment_role_code).HasMaxLength(50);
            entity.Property(e => e.is_primary_team).HasDefaultValue(false);
            entity.Property(e => e.response_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");

            entity.HasOne(d => d.doi_cuu_ho).WithMany(p => p.phan_cong_dois)
                .HasForeignKey(d => d.doi_cuu_ho_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("phan_cong_doi_doi_cuu_ho_id_fkey");

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.phan_cong_dois)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("phan_cong_doi_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.rejection_ly_do).WithMany(p => p.phan_cong_dois)
                .HasForeignKey(d => d.rejection_ly_do_id)
                .HasConstraintName("phan_cong_doi_rejection_ly_do_id_fkey");
        });

        modelBuilder.Entity<phan_cong_phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phan_cong_phuong_tien_pkey");

            entity.ToTable("phan_cong_phuong_tien");

            entity.HasIndex(e => new { e.nhiem_vu_cuu_ho_id, e.phuong_tien_id }, "phan_cong_phuong_tien_nhiem_vu_cuu_ho_id_phuong_tien_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.assigned_at).HasDefaultValueSql("now()");
            entity.Property(e => e.assignment_role_code).HasMaxLength(50);

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.phan_cong_phuong_tiens)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("phan_cong_phuong_tien_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.phuong_tien).WithMany(p => p.phan_cong_phuong_tiens)
                .HasForeignKey(d => d.phuong_tien_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("phan_cong_phuong_tien_phuong_tien_id_fkey");
        });

        modelBuilder.Entity<phan_cong_thanh_vien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phan_cong_thanh_vien_pkey");

            entity.ToTable("phan_cong_thanh_vien");

            entity.HasIndex(e => new { e.phan_cong_doi_id, e.thanh_vien_doi_id }, "phan_cong_thanh_vien_phan_cong_doi_id_thanh_vien_doi_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.mission_function_code).HasMaxLength(50);
            entity.Property(e => e.response_status_code).HasMaxLength(50);

            entity.HasOne(d => d.phan_cong_doi).WithMany(p => p.phan_cong_thanh_viens)
                .HasForeignKey(d => d.phan_cong_doi_id)
                .HasConstraintName("phan_cong_thanh_vien_phan_cong_doi_id_fkey");

            entity.HasOne(d => d.thanh_vien_doi).WithMany(p => p.phan_cong_thanh_viens)
                .HasForeignKey(d => d.thanh_vien_doi_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("phan_cong_thanh_vien_thanh_vien_doi_id_fkey");
        });

        modelBuilder.Entity<phat_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phat_cuu_tro_pkey");

            entity.ToTable("phat_cuu_tro");

            entity.HasIndex(e => e.distribution_code, "phat_cuu_tro_distribution_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ack_code).HasMaxLength(50);
            entity.Property(e => e.ack_method_code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.distribution_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chien_dich_cuu_tro).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.chien_dich_cuu_tro_id)
                .HasConstraintName("phat_cuu_tro_chien_dich_cuu_tro_id_fkey");

            entity.HasOne(d => d.cong_dan).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.cong_dan_id)
                .HasConstraintName("phat_cuu_tro_cong_dan_id_fkey");

            entity.HasOne(d => d.diem_cuu_tro).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.diem_cuu_tro_id)
                .HasConstraintName("phat_cuu_tro_diem_cuu_tro_id_fkey");

            entity.HasOne(d => d.distributed_byNavigation).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.distributed_by)
                .HasConstraintName("phat_cuu_tro_distributed_by_fkey");

            entity.HasOne(d => d.ho_dan).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.ho_dan_id)
                .HasConstraintName("phat_cuu_tro_ho_dan_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("phat_cuu_tro_su_co_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.phat_cuu_tros)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("phat_cuu_tro_workflow_state_id_fkey");
        });

        modelBuilder.Entity<phieu_cap_phat_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phieu_cap_phat_cuu_tro_pkey");

            entity.ToTable("phieu_cap_phat_cuu_tro");

            entity.HasIndex(e => e.relief_issue_code, "phieu_cap_phat_cuu_tro_relief_issue_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.relief_issue_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chien_dich_cuu_tro).WithMany(p => p.phieu_cap_phat_cuu_tros)
                .HasForeignKey(d => d.chien_dich_cuu_tro_id)
                .HasConstraintName("phieu_cap_phat_cuu_tro_chien_dich_cuu_tro_id_fkey");

            entity.HasOne(d => d.diem_cuu_tro).WithMany(p => p.phieu_cap_phat_cuu_tros)
                .HasForeignKey(d => d.diem_cuu_tro_id)
                .HasConstraintName("phieu_cap_phat_cuu_tro_diem_cuu_tro_id_fkey");

            entity.HasOne(d => d.from_kho).WithMany(p => p.phieu_cap_phat_cuu_tros)
                .HasForeignKey(d => d.from_kho_id)
                .HasConstraintName("phieu_cap_phat_cuu_tro_from_kho_id_fkey");

            entity.HasOne(d => d.issued_byNavigation).WithMany(p => p.phieu_cap_phat_cuu_troissued_byNavigations)
                .HasForeignKey(d => d.issued_by)
                .HasConstraintName("phieu_cap_phat_cuu_tro_issued_by_fkey");

            entity.HasOne(d => d.received_byNavigation).WithMany(p => p.phieu_cap_phat_cuu_troreceived_byNavigations)
                .HasForeignKey(d => d.received_by)
                .HasConstraintName("phieu_cap_phat_cuu_tro_received_by_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.phieu_cap_phat_cuu_tros)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("phieu_cap_phat_cuu_tro_workflow_state_id_fkey");
        });

        modelBuilder.Entity<phieu_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phieu_kho_pkey");

            entity.ToTable("phieu_kho");

            entity.HasIndex(e => e.transaction_code, "phieu_kho_transaction_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.happened_at).HasDefaultValueSql("now()");
            entity.Property(e => e.reference_type).HasMaxLength(50);
            entity.Property(e => e.transaction_code).HasMaxLength(50);
            entity.Property(e => e.transaction_type_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.approved_byNavigation).WithMany(p => p.phieu_khoapproved_byNavigations)
                .HasForeignKey(d => d.approved_by)
                .HasConstraintName("phieu_kho_approved_by_fkey");

            entity.HasOne(d => d.created_byNavigation).WithMany(p => p.phieu_khocreated_byNavigations)
                .HasForeignKey(d => d.created_by)
                .HasConstraintName("phieu_kho_created_by_fkey");

            entity.HasOne(d => d.dest_kho).WithMany(p => p.phieu_khodest_khos)
                .HasForeignKey(d => d.dest_kho_id)
                .HasConstraintName("phieu_kho_dest_kho_id_fkey");

            entity.HasOne(d => d.source_kho).WithMany(p => p.phieu_khosource_khos)
                .HasForeignKey(d => d.source_kho_id)
                .HasConstraintName("phieu_kho_source_kho_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.phieu_khos)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("phieu_kho_workflow_state_id_fkey");
        });

        modelBuilder.Entity<phuong_tien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phuong_tien_pkey");

            entity.ToTable("phuong_tien");

            entity.HasIndex(e => new { e.status_code, e.loai_phuong_tien_id }, "idx_phuong_tien_status_type");

            entity.HasIndex(e => e.vehicle_code, "phuong_tien_vehicle_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.capacity_weight_kg).HasPrecision(12, 2);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.display_name).HasMaxLength(255);
            entity.Property(e => e.fuel_type_code).HasMaxLength(50);
            entity.Property(e => e.plate_no).HasMaxLength(50);
            entity.Property(e => e.range_km).HasPrecision(12, 2);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'AVAILABLE'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.vehicle_code).HasMaxLength(50);

            entity.HasOne(d => d.home_dia_diem).WithMany(p => p.phuong_tiens)
                .HasForeignKey(d => d.home_dia_diem_id)
                .HasConstraintName("phuong_tien_home_dia_diem_id_fkey");

            entity.HasOne(d => d.loai_phuong_tien).WithMany(p => p.phuong_tiens)
                .HasForeignKey(d => d.loai_phuong_tien_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("phuong_tien_loai_phuong_tien_id_fkey");
        });

        modelBuilder.Entity<phuong_tien_nang_luc>(entity =>
        {
            entity.HasKey(e => e.id).HasName("phuong_tien_nang_luc_pkey");

            entity.ToTable("phuong_tien_nang_luc");

            entity.HasIndex(e => new { e.phuong_tien_id, e.nang_luc_phuong_tien_id }, "phuong_tien_nang_luc_phuong_tien_id_nang_luc_phuong_tien_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.nang_luc_phuong_tien).WithMany(p => p.phuong_tien_nang_lucs)
                .HasForeignKey(d => d.nang_luc_phuong_tien_id)
                .HasConstraintName("phuong_tien_nang_luc_nang_luc_phuong_tien_id_fkey");

            entity.HasOne(d => d.phuong_tien).WithMany(p => p.phuong_tien_nang_lucs)
                .HasForeignKey(d => d.phuong_tien_id)
                .HasConstraintName("phuong_tien_nang_luc_phuong_tien_id_fkey");
        });

        modelBuilder.Entity<quyen>(entity =>
        {
            entity.HasKey(e => e.id).HasName("quyen_pkey");

            entity.ToTable("quyen");

            entity.HasIndex(e => new { e.module_code, e.action_code }, "quyen_module_code_action_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.action_code).HasMaxLength(100);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.module_code).HasMaxLength(100);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<scene_factor_def>(entity =>
        {
            entity.HasKey(e => e.id).HasName("scene_factor_defs_pkey");

            entity.HasIndex(e => e.code, "scene_factor_defs_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.unit_group_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.value_type).HasMaxLength(30);
        });

        modelBuilder.Entity<su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("su_co_pkey");

            entity.ToTable("su_co");

            entity.HasIndex(e => new { e.assigned_coordinator_user_id, e.workflow_state_id }, "idx_su_co_coordinator_state");

            entity.HasIndex(e => new { e.workflow_state_id, e.muc_do_uu_tien_id, e.reported_at }, "idx_su_co_state_priority_reported_at").IsDescending(false, false, true);

            entity.HasIndex(e => new { e.loai_su_co_id, e.reported_at }, "idx_su_co_type_reported_at").IsDescending(false, true);

            entity.HasIndex(e => e.incident_code, "su_co_incident_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.co_can_cuu_tro).HasDefaultValue(false);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.incident_code).HasMaxLength(50);
            entity.Property(e => e.is_sos).HasDefaultValue(false);
            entity.Property(e => e.reported_at).HasDefaultValueSql("now()");
            entity.Property(e => e.reporter_name).HasMaxLength(255);
            entity.Property(e => e.reporter_phone).HasMaxLength(30);
            entity.Property(e => e.subject).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.assigned_coordinator_user).WithMany(p => p.su_coassigned_coordinator_users)
                .HasForeignKey(d => d.assigned_coordinator_user_id)
                .HasConstraintName("su_co_assigned_coordinator_user_id_fkey");

            entity.HasOne(d => d.closed_byNavigation).WithMany(p => p.su_coclosed_byNavigations)
                .HasForeignKey(d => d.closed_by)
                .HasConstraintName("su_co_closed_by_fkey");

            entity.HasOne(d => d.kenh_tiep_nhan).WithMany(p => p.su_cos)
                .HasForeignKey(d => d.kenh_tiep_nhan_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("su_co_kenh_tiep_nhan_id_fkey");

            entity.HasOne(d => d.loai_su_co).WithMany(p => p.su_cos)
                .HasForeignKey(d => d.loai_su_co_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("su_co_loai_su_co_id_fkey");

            entity.HasOne(d => d.muc_do_nghiem_trong).WithMany(p => p.su_cos)
                .HasForeignKey(d => d.muc_do_nghiem_trong_id)
                .HasConstraintName("su_co_muc_do_nghiem_trong_id_fkey");

            entity.HasOne(d => d.muc_do_uu_tien).WithMany(p => p.su_cos)
                .HasForeignKey(d => d.muc_do_uu_tien_id)
                .HasConstraintName("su_co_muc_do_uu_tien_id_fkey");

            entity.HasOne(d => d.reporter_user).WithMany(p => p.su_coreporter_users)
                .HasForeignKey(d => d.reporter_user_id)
                .HasConstraintName("su_co_reporter_user_id_fkey");

            entity.HasOne(d => d.verified_byNavigation).WithMany(p => p.su_coverified_byNavigations)
                .HasForeignKey(d => d.verified_by)
                .HasConstraintName("su_co_verified_by_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.su_cos)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("su_co_workflow_state_id_fkey");
        });

        modelBuilder.Entity<tep_tin>(entity =>
        {
            entity.HasKey(e => e.id).HasName("tep_tin_pkey");

            entity.ToTable("tep_tin");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.checksum).HasMaxLength(255);
            entity.Property(e => e.content_type).HasMaxLength(100);
            entity.Property(e => e.file_name).HasMaxLength(255);
            entity.Property(e => e.file_size).HasDefaultValue(0L);
            entity.Property(e => e.storage_bucket).HasMaxLength(255);
            entity.Property(e => e.uploaded_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.uploaded_byNavigation).WithMany(p => p.tep_tins)
                .HasForeignKey(d => d.uploaded_by)
                .HasConstraintName("tep_tin_uploaded_by_fkey");
        });

        modelBuilder.Entity<tep_tin_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("tep_tin_su_co_pkey");

            entity.ToTable("tep_tin_su_co");

            entity.HasIndex(e => new { e.su_co_id, e.tep_tin_id }, "tep_tin_su_co_su_co_id_tep_tin_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.media_role_code).HasMaxLength(50);

            entity.HasOne(d => d.su_co).WithMany(p => p.tep_tin_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("tep_tin_su_co_su_co_id_fkey");

            entity.HasOne(d => d.tep_tin).WithMany(p => p.tep_tin_su_cos)
                .HasForeignKey(d => d.tep_tin_id)
                .HasConstraintName("tep_tin_su_co_tep_tin_id_fkey");

            entity.HasOne(d => d.uploaded_byNavigation).WithMany(p => p.tep_tin_su_cos)
                .HasForeignKey(d => d.uploaded_by)
                .HasConstraintName("tep_tin_su_co_uploaded_by_fkey");
        });

        modelBuilder.Entity<thanh_vien_doi>(entity =>
        {
            entity.HasKey(e => e.id).HasName("thanh_vien_doi_pkey");

            entity.ToTable("thanh_vien_doi");

            entity.HasIndex(e => new { e.doi_cuu_ho_id, e.availability_status_code }, "idx_thanh_vien_doi_team_availability");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.availability_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'AVAILABLE'::character varying");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.full_name).HasMaxLength(255);
            entity.Property(e => e.gender_code).HasMaxLength(30);
            entity.Property(e => e.health_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'NORMAL'::character varying");
            entity.Property(e => e.is_team_leader).HasDefaultValue(false);
            entity.Property(e => e.member_code).HasMaxLength(50);
            entity.Property(e => e.member_role_code).HasMaxLength(50);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.doi_cuu_ho).WithMany(p => p.thanh_vien_dois)
                .HasForeignKey(d => d.doi_cuu_ho_id)
                .HasConstraintName("thanh_vien_doi_doi_cuu_ho_id_fkey");

            entity.HasOne(d => d.user).WithMany(p => p.thanh_vien_dois)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("thanh_vien_doi_user_id_fkey");
        });

        modelBuilder.Entity<thong_bao>(entity =>
        {
            entity.HasKey(e => e.id).HasName("thong_bao_pkey");

            entity.ToTable("thong_bao");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.channel_code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.entity_type).HasMaxLength(50);
            entity.Property(e => e.event_type_code).HasMaxLength(50);
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");
        });

        modelBuilder.Entity<thong_so_he_thong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("thong_so_he_thong_pkey");

            entity.ToTable("thong_so_he_thong");

            entity.HasIndex(e => e.param_key, "thong_so_he_thong_param_key_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.param_group).HasMaxLength(100);
            entity.Property(e => e.param_key).HasMaxLength(100);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.value_type)
                .HasMaxLength(50)
                .HasDefaultValueSql("'STRING'::character varying");

            entity.HasOne(d => d.updated_byNavigation).WithMany(p => p.thong_so_he_thongs)
                .HasForeignKey(d => d.updated_by)
                .HasConstraintName("thong_so_he_thong_updated_by_fkey");
        });

        modelBuilder.Entity<tinh_trang_hien_truong>(entity =>
        {
            entity.HasKey(e => e.id).HasName("tinh_trang_hien_truong_pkey");

            entity.ToTable("tinh_trang_hien_truong");

            entity.HasIndex(e => new { e.su_co_id, e.observed_at }, "idx_tinh_trang_hien_truong_su_co_observed_at").IsDescending(false, true);

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.access_condition_code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.hazard_level_code).HasMaxLength(50);
            entity.Property(e => e.is_current).HasDefaultValue(true);
            entity.Property(e => e.observation_source_code).HasMaxLength(50);
            entity.Property(e => e.observed_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.observed_by_user).WithMany(p => p.tinh_trang_hien_truongs)
                .HasForeignKey(d => d.observed_by_user_id)
                .HasConstraintName("tinh_trang_hien_truong_observed_by_user_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.tinh_trang_hien_truongs)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("tinh_trang_hien_truong_su_co_id_fkey");
        });

        modelBuilder.Entity<to_chuc>(entity =>
        {
            entity.HasKey(e => e.id).HasName("to_chuc_pkey");

            entity.ToTable("to_chuc");

            entity.HasIndex(e => e.code, "to_chuc_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.phone).HasMaxLength(30);
            entity.Property(e => e.short_name).HasMaxLength(100);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<ton_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ton_kho_pkey");

            entity.ToTable("ton_kho");

            entity.HasIndex(e => new { e.kho_id, e.mat_hang_id, e.lo_hang_id }, "idx_ton_kho_lookup");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.qty_available).HasPrecision(18, 4);
            entity.Property(e => e.qty_on_hand).HasPrecision(18, 4);
            entity.Property(e => e.qty_reserved).HasPrecision(18, 4);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.kho).WithMany(p => p.ton_khos)
                .HasForeignKey(d => d.kho_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ton_kho_kho_id_fkey");

            entity.HasOne(d => d.khu_kho).WithMany(p => p.ton_khos)
                .HasForeignKey(d => d.khu_kho_id)
                .HasConstraintName("ton_kho_khu_kho_id_fkey");

            entity.HasOne(d => d.lo_hang).WithMany(p => p.ton_khos)
                .HasForeignKey(d => d.lo_hang_id)
                .HasConstraintName("ton_kho_lo_hang_id_fkey");

            entity.HasOne(d => d.mat_hang).WithMany(p => p.ton_khos)
                .HasForeignKey(d => d.mat_hang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ton_kho_mat_hang_id_fkey");

            entity.HasOne(d => d.vi_tri_kho).WithMany(p => p.ton_khos)
                .HasForeignKey(d => d.vi_tri_kho_id)
                .HasConstraintName("ton_kho_vi_tri_kho_id_fkey");
        });

        modelBuilder.Entity<vai_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vai_tro_pkey");

            entity.ToTable("vai_tro");

            entity.HasIndex(e => e.code, "vai_tro_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<vai_tro_quyen>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vai_tro_quyen_pkey");

            entity.ToTable("vai_tro_quyen");

            entity.HasIndex(e => new { e.vai_tro_id, e.quyen_id }, "vai_tro_quyen_vai_tro_id_quyen_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.quyen).WithMany(p => p.vai_tro_quyens)
                .HasForeignKey(d => d.quyen_id)
                .HasConstraintName("vai_tro_quyen_quyen_id_fkey");

            entity.HasOne(d => d.vai_tro).WithMany(p => p.vai_tro_quyens)
                .HasForeignKey(d => d.vai_tro_id)
                .HasConstraintName("vai_tro_quyen_vai_tro_id_fkey");
        });

        modelBuilder.Entity<vi_tri_kho>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vi_tri_kho_pkey");

            entity.ToTable("vi_tri_kho");

            entity.HasIndex(e => new { e.khu_kho_id, e.bin_code }, "vi_tri_kho_khu_kho_id_bin_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.bin_code).HasMaxLength(50);
            entity.Property(e => e.bin_name).HasMaxLength(255);
            entity.Property(e => e.bin_type_code).HasMaxLength(50);
            entity.Property(e => e.capacity_volume_m3).HasPrecision(12, 2);
            entity.Property(e => e.capacity_weight_kg).HasPrecision(12, 2);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'ACTIVE'::character varying");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.khu_kho).WithMany(p => p.vi_tri_khos)
                .HasForeignKey(d => d.khu_kho_id)
                .HasConstraintName("vi_tri_kho_khu_kho_id_fkey");
        });

        modelBuilder.Entity<vi_tri_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vi_tri_su_co_pkey");

            entity.ToTable("vi_tri_su_co");

            entity.HasIndex(e => e.geom, "idx_vi_tri_su_co_geom").HasMethod("gist");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.accuracy_meter).HasPrecision(10, 2);
            entity.Property(e => e.captured_at).HasDefaultValueSql("now()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.is_current).HasDefaultValue(true);
            entity.Property(e => e.landmark).HasMaxLength(255);
            entity.Property(e => e.lat).HasPrecision(10, 7);
            entity.Property(e => e.lng).HasPrecision(10, 7);
            entity.Property(e => e.location_source_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.captured_byNavigation).WithMany(p => p.vi_tri_su_cos)
                .HasForeignKey(d => d.captured_by)
                .HasConstraintName("vi_tri_su_co_captured_by_fkey");

            entity.HasOne(d => d.khu_vuc_hanh_chinh).WithMany(p => p.vi_tri_su_cos)
                .HasForeignKey(d => d.khu_vuc_hanh_chinh_id)
                .HasConstraintName("vi_tri_su_co_khu_vuc_hanh_chinh_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.vi_tri_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("vi_tri_su_co_su_co_id_fkey");
        });

        modelBuilder.Entity<vung_phu_trach>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vung_phu_trach_pkey");

            entity.ToTable("vung_phu_trach");

            entity.HasIndex(e => e.code, "vung_phu_trach_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(MultiPolygon,4326)");
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
            entity.Property(e => e.zone_type_code).HasMaxLength(50);

            entity.HasOne(d => d.parent).WithMany(p => p.Inverseparent)
                .HasForeignKey(d => d.parent_id)
                .HasConstraintName("vung_phu_trach_parent_id_fkey");

            entity.HasOne(d => d.responsible_don_vi).WithMany(p => p.vung_phu_traches)
                .HasForeignKey(d => d.responsible_don_vi_id)
                .HasConstraintName("vung_phu_trach_responsible_don_vi_id_fkey");
        });

        modelBuilder.Entity<workflow_process>(entity =>
        {
            entity.HasKey(e => e.id).HasName("workflow_processes_pkey");

            entity.HasIndex(e => e.code, "workflow_processes_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.entity_type).HasMaxLength(50);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<workflow_state>(entity =>
        {
            entity.HasKey(e => e.id).HasName("workflow_states_pkey");

            entity.HasIndex(e => new { e.workflow_process_id, e.code }, "workflow_states_workflow_process_id_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.code).HasMaxLength(50);
            entity.Property(e => e.color_code).HasMaxLength(20);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_initial).HasDefaultValue(false);
            entity.Property(e => e.is_terminal).HasDefaultValue(false);
            entity.Property(e => e.name).HasMaxLength(255);
            entity.Property(e => e.sort_order).HasDefaultValue(0);
            entity.Property(e => e.state_category_code).HasMaxLength(50);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.workflow_process).WithMany(p => p.workflow_states)
                .HasForeignKey(d => d.workflow_process_id)
                .HasConstraintName("workflow_states_workflow_process_id_fkey");
        });

        modelBuilder.Entity<workflow_transition>(entity =>
        {
            entity.HasKey(e => e.id).HasName("workflow_transitions_pkey");

            entity.HasIndex(e => new { e.workflow_process_id, e.from_state_id, e.to_state_id, e.action_code }, "workflow_transitions_workflow_process_id_from_state_id_to_s_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.action_code).HasMaxLength(50);
            entity.Property(e => e.action_name).HasMaxLength(255);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.requires_note).HasDefaultValue(false);
            entity.Property(e => e.requires_reason).HasDefaultValue(false);

            entity.HasOne(d => d.from_state).WithMany(p => p.workflow_transitionfrom_states)
                .HasForeignKey(d => d.from_state_id)
                .HasConstraintName("workflow_transitions_from_state_id_fkey");

            entity.HasOne(d => d.to_state).WithMany(p => p.workflow_transitionto_states)
                .HasForeignKey(d => d.to_state_id)
                .HasConstraintName("workflow_transitions_to_state_id_fkey");

            entity.HasOne(d => d.workflow_process).WithMany(p => p.workflow_transitions)
                .HasForeignKey(d => d.workflow_process_id)
                .HasConstraintName("workflow_transitions_workflow_process_id_fkey");
        });

        modelBuilder.Entity<xac_nhan_duoc_cuu>(entity =>
        {
            entity.HasKey(e => e.id).HasName("xac_nhan_duoc_cuu_pkey");

            entity.ToTable("xac_nhan_duoc_cuu");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ack_at).HasDefaultValueSql("now()");
            entity.Property(e => e.ack_code).HasMaxLength(50);
            entity.Property(e => e.ack_method_code).HasMaxLength(50);
            entity.Property(e => e.ack_name).HasMaxLength(255);
            entity.Property(e => e.ack_phone).HasMaxLength(30);
            entity.Property(e => e.ack_type_code).HasMaxLength(50);

            entity.HasOne(d => d.ack_by_user).WithMany(p => p.xac_nhan_duoc_cuus)
                .HasForeignKey(d => d.ack_by_user_id)
                .HasConstraintName("xac_nhan_duoc_cuu_ack_by_user_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.xac_nhan_duoc_cuus)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("xac_nhan_duoc_cuu_su_co_id_fkey");
        });

        modelBuilder.Entity<xac_nhan_nhan_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("xac_nhan_nhan_cuu_tro_pkey");

            entity.ToTable("xac_nhan_nhan_cuu_tro");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ack_by_name).HasMaxLength(255);
            entity.Property(e => e.ack_by_phone).HasMaxLength(30);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.phat_cuu_tro).WithMany(p => p.xac_nhan_nhan_cuu_tros)
                .HasForeignKey(d => d.phat_cuu_tro_id)
                .HasConstraintName("xac_nhan_nhan_cuu_tro_phat_cuu_tro_id_fkey");

            entity.HasOne(d => d.signature_tep_tin).WithMany(p => p.xac_nhan_nhan_cuu_tros)
                .HasForeignKey(d => d.signature_tep_tin_id)
                .HasConstraintName("xac_nhan_nhan_cuu_tro_signature_tep_tin_id_fkey");
        });

        modelBuilder.Entity<yeu_cau_chi_vien>(entity =>
        {
            entity.HasKey(e => e.id).HasName("yeu_cau_chi_vien_pkey");

            entity.ToTable("yeu_cau_chi_vien");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");
            entity.Property(e => e.status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");
            entity.Property(e => e.support_type_code).HasMaxLength(50);

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.yeu_cau_chi_viens)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("yeu_cau_chi_vien_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.requested_byNavigation).WithMany(p => p.yeu_cau_chi_viens)
                .HasForeignKey(d => d.requested_by)
                .HasConstraintName("yeu_cau_chi_vien_requested_by_fkey");
        });

        modelBuilder.Entity<yeu_cau_cuu_tro>(entity =>
        {
            entity.HasKey(e => e.id).HasName("yeu_cau_cuu_tro_pkey");

            entity.ToTable("yeu_cau_cuu_tro");

            entity.HasIndex(e => new { e.workflow_state_id, e.muc_do_uu_tien_id, e.requested_at }, "idx_yeu_cau_cuu_tro_state_priority").IsDescending(false, false, true);

            entity.HasIndex(e => e.request_code, "yeu_cau_cuu_tro_request_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.request_code).HasMaxLength(50);
            entity.Property(e => e.request_source_type_code).HasMaxLength(50);
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");
            entity.Property(e => e.requester_name).HasMaxLength(255);
            entity.Property(e => e.requester_phone).HasMaxLength(30);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.chien_dich_cuu_tro).WithMany(p => p.yeu_cau_cuu_tros)
                .HasForeignKey(d => d.chien_dich_cuu_tro_id)
                .HasConstraintName("yeu_cau_cuu_tro_chien_dich_cuu_tro_id_fkey");

            entity.HasOne(d => d.muc_do_uu_tien).WithMany(p => p.yeu_cau_cuu_tros)
                .HasForeignKey(d => d.muc_do_uu_tien_id)
                .HasConstraintName("yeu_cau_cuu_tro_muc_do_uu_tien_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.yeu_cau_cuu_tros)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("yeu_cau_cuu_tro_su_co_id_fkey");

            entity.HasOne(d => d.target_khu_vuc).WithMany(p => p.yeu_cau_cuu_tros)
                .HasForeignKey(d => d.target_khu_vuc_id)
                .HasConstraintName("yeu_cau_cuu_tro_target_khu_vuc_id_fkey");

            entity.HasOne(d => d.workflow_state).WithMany(p => p.yeu_cau_cuu_tros)
                .HasForeignKey(d => d.workflow_state_id)
                .HasConstraintName("yeu_cau_cuu_tro_workflow_state_id_fkey");
        });

        modelBuilder.Entity<yeu_cau_huy_nhiem_vu>(entity =>
        {
            entity.HasKey(e => e.id).HasName("yeu_cau_huy_nhiem_vu_pkey");

            entity.ToTable("yeu_cau_huy_nhiem_vu");

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.decision_status_code)
                .HasMaxLength(50)
                .HasDefaultValueSql("'PENDING'::character varying");
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.decided_byNavigation).WithMany(p => p.yeu_cau_huy_nhiem_vudecided_byNavigations)
                .HasForeignKey(d => d.decided_by)
                .HasConstraintName("yeu_cau_huy_nhiem_vu_decided_by_fkey");

            entity.HasOne(d => d.ly_do).WithMany(p => p.yeu_cau_huy_nhiem_vus)
                .HasForeignKey(d => d.ly_do_id)
                .HasConstraintName("yeu_cau_huy_nhiem_vu_ly_do_id_fkey");

            entity.HasOne(d => d.nhiem_vu_cuu_ho).WithMany(p => p.yeu_cau_huy_nhiem_vus)
                .HasForeignKey(d => d.nhiem_vu_cuu_ho_id)
                .HasConstraintName("yeu_cau_huy_nhiem_vu_nhiem_vu_cuu_ho_id_fkey");

            entity.HasOne(d => d.requested_byNavigation).WithMany(p => p.yeu_cau_huy_nhiem_vurequested_byNavigations)
                .HasForeignKey(d => d.requested_by)
                .HasConstraintName("yeu_cau_huy_nhiem_vu_requested_by_fkey");
        });

        modelBuilder.Entity<yeu_cau_ky_nang_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("yeu_cau_ky_nang_su_co_pkey");

            entity.ToTable("yeu_cau_ky_nang_su_co");

            entity.HasIndex(e => new { e.su_co_id, e.ky_nang_id }, "yeu_cau_ky_nang_su_co_su_co_id_ky_nang_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_mandatory).HasDefaultValue(true);
            entity.Property(e => e.required_count).HasDefaultValue(1);

            entity.HasOne(d => d.cap_do_ky_nang).WithMany(p => p.yeu_cau_ky_nang_su_cos)
                .HasForeignKey(d => d.cap_do_ky_nang_id)
                .HasConstraintName("yeu_cau_ky_nang_su_co_cap_do_ky_nang_id_fkey");

            entity.HasOne(d => d.ky_nang).WithMany(p => p.yeu_cau_ky_nang_su_cos)
                .HasForeignKey(d => d.ky_nang_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("yeu_cau_ky_nang_su_co_ky_nang_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.yeu_cau_ky_nang_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("yeu_cau_ky_nang_su_co_su_co_id_fkey");
        });

        modelBuilder.Entity<yeu_cau_nang_luc_phuong_tien_su_co>(entity =>
        {
            entity.HasKey(e => e.id).HasName("yeu_cau_nang_luc_phuong_tien_su_co_pkey");

            entity.ToTable("yeu_cau_nang_luc_phuong_tien_su_co");

            entity.HasIndex(e => new { e.su_co_id, e.nang_luc_phuong_tien_id }, "yeu_cau_nang_luc_phuong_tien__su_co_id_nang_luc_phuong_tien_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_mandatory).HasDefaultValue(true);
            entity.Property(e => e.required_count).HasDefaultValue(1);

            entity.HasOne(d => d.nang_luc_phuong_tien).WithMany(p => p.yeu_cau_nang_luc_phuong_tien_su_cos)
                .HasForeignKey(d => d.nang_luc_phuong_tien_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("yeu_cau_nang_luc_phuong_tien_su_co_nang_luc_phuong_tien_id_fkey");

            entity.HasOne(d => d.su_co).WithMany(p => p.yeu_cau_nang_luc_phuong_tien_su_cos)
                .HasForeignKey(d => d.su_co_id)
                .HasConstraintName("yeu_cau_nang_luc_phuong_tien_su_co_su_co_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

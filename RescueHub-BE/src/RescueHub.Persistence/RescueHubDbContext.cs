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

    public virtual DbSet<admin_area> admin_areas { get; set; }

    public virtual DbSet<ai_job> ai_jobs { get; set; }

    public virtual DbSet<ai_suggestion> ai_suggestions { get; set; }

    public virtual DbSet<app_role> app_roles { get; set; }

    public virtual DbSet<app_user> app_users { get; set; }

    public virtual DbSet<app_user_role> app_user_roles { get; set; }

    public virtual DbSet<audit_log> audit_logs { get; set; }

    public virtual DbSet<distribution> distributions { get; set; }

    public virtual DbSet<distribution_ack> distribution_acks { get; set; }

    public virtual DbSet<distribution_line> distribution_lines { get; set; }

    public virtual DbSet<flood_risk_zone> flood_risk_zones { get; set; }

    public virtual DbSet<household> households { get; set; }

    public virtual DbSet<incident> incidents { get; set; }

    public virtual DbSet<incident_assessment> incident_assessments { get; set; }

    public virtual DbSet<incident_location> incident_locations { get; set; }

    public virtual DbSet<incident_medium> incident_media { get; set; }

    public virtual DbSet<incident_requirement_skill> incident_requirement_skills { get; set; }

    public virtual DbSet<incident_requirement_vehicle_capability> incident_requirement_vehicle_capabilities { get; set; }

    public virtual DbSet<incident_status_history> incident_status_histories { get; set; }

    public virtual DbSet<item> items { get; set; }

    public virtual DbSet<item_category> item_categories { get; set; }

    public virtual DbSet<item_lot> item_lots { get; set; }

    public virtual DbSet<mission> missions { get; set; }

    public virtual DbSet<mission_abort_request> mission_abort_requests { get; set; }

    public virtual DbSet<mission_field_report> mission_field_reports { get; set; }

    public virtual DbSet<mission_field_report_medium> mission_field_report_media { get; set; }

    public virtual DbSet<mission_member> mission_members { get; set; }

    public virtual DbSet<mission_status_history> mission_status_histories { get; set; }

    public virtual DbSet<mission_support_request> mission_support_requests { get; set; }

    public virtual DbSet<mission_team> mission_teams { get; set; }

    public virtual DbSet<mission_vehicle> mission_vehicles { get; set; }

    public virtual DbSet<notification> notifications { get; set; }

    public virtual DbSet<relief_campaign> relief_campaigns { get; set; }

    public virtual DbSet<relief_issue> relief_issues { get; set; }

    public virtual DbSet<relief_issue_line> relief_issue_lines { get; set; }

    public virtual DbSet<relief_point> relief_points { get; set; }

    public virtual DbSet<relief_request> relief_requests { get; set; }

    public virtual DbSet<relief_request_item> relief_request_items { get; set; }

    public virtual DbSet<rescue_ack> rescue_acks { get; set; }

    public virtual DbSet<skill> skills { get; set; }

    public virtual DbSet<stock_alert> stock_alerts { get; set; }

    public virtual DbSet<stock_balance> stock_balances { get; set; }

    public virtual DbSet<stock_transaction> stock_transactions { get; set; }

    public virtual DbSet<stock_transaction_line> stock_transaction_lines { get; set; }

    public virtual DbSet<team> teams { get; set; }

    public virtual DbSet<team_member> team_members { get; set; }

    public virtual DbSet<team_member_skill> team_member_skills { get; set; }

    public virtual DbSet<user_notification> user_notifications { get; set; }

    public virtual DbSet<vehicle> vehicles { get; set; }

    public virtual DbSet<vehicle_capability> vehicle_capabilities { get; set; }

    public virtual DbSet<vehicle_type> vehicle_types { get; set; }

    public virtual DbSet<warehouse> warehouses { get; set; }

    public virtual DbSet<warehouse_bin> warehouse_bins { get; set; }

    public virtual DbSet<warehouse_zone> warehouse_zones { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresExtension("pgcrypto")
            .HasPostgresExtension("postgis");

        modelBuilder.Entity<admin_area>(entity =>
        {
            entity.HasKey(e => e.id).HasName("admin_area_pkey");

            entity.ToTable("admin_area");

            entity.HasIndex(e => e.code, "admin_area_code_key").IsUnique();

            entity.HasIndex(e => e.geom, "idx_admin_area_geom").HasMethod("gist");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.centroid).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(MultiPolygon,4326)");

            entity.HasOne(d => d.parent).WithMany(p => p.Inverseparent)
                .HasForeignKey(d => d.parent_id)
                .HasConstraintName("admin_area_parent_id_fkey");
        });

        modelBuilder.Entity<ai_job>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ai_job_pkey");

            entity.ToTable("ai_job");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.input_payload).HasColumnType("jsonb");
            entity.Property(e => e.output_payload).HasColumnType("jsonb");
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.requested_by_user).WithMany(p => p.ai_jobs)
                .HasForeignKey(d => d.requested_by_user_id)
                .HasConstraintName("ai_job_requested_by_user_id_fkey");
        });

        modelBuilder.Entity<ai_suggestion>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ai_suggestion_pkey");

            entity.ToTable("ai_suggestion");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.confidence_score).HasPrecision(5, 4);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.payload_json).HasColumnType("jsonb");

            entity.HasOne(d => d.ai_job).WithMany(p => p.ai_suggestions)
                .HasForeignKey(d => d.ai_job_id)
                .HasConstraintName("ai_suggestion_ai_job_id_fkey");

            entity.HasOne(d => d.approved_by_user).WithMany(p => p.ai_suggestions)
                .HasForeignKey(d => d.approved_by_user_id)
                .HasConstraintName("ai_suggestion_approved_by_user_id_fkey");
        });

        modelBuilder.Entity<app_role>(entity =>
        {
            entity.HasKey(e => e.id).HasName("app_role_pkey");

            entity.ToTable("app_role");

            entity.HasIndex(e => e.code, "app_role_code_key").IsUnique();

            entity.HasIndex(e => e.name, "app_role_name_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
        });

        modelBuilder.Entity<app_user>(entity =>
        {
            entity.HasKey(e => e.id).HasName("app_user_pkey");

            entity.ToTable("app_user");

            entity.HasIndex(e => e.email, "app_user_email_key").IsUnique();

            entity.HasIndex(e => e.phone, "app_user_phone_key").IsUnique();

            entity.HasIndex(e => e.username, "app_user_username_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.password_hash_algo).HasDefaultValueSql("'ASP.NET Identity V3 PBKDF2-HMACSHA512'::text");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<app_user_role>(entity =>
        {
            entity.HasKey(e => new { e.user_id, e.role_id }).HasName("app_user_role_pkey");

            entity.ToTable("app_user_role");

            entity.Property(e => e.assigned_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.role).WithMany(p => p.app_user_roles)
                .HasForeignKey(d => d.role_id)
                .HasConstraintName("app_user_role_role_id_fkey");

            entity.HasOne(d => d.user).WithMany(p => p.app_user_roles)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("app_user_role_user_id_fkey");
        });

        modelBuilder.Entity<audit_log>(entity =>
        {
            entity.HasKey(e => e.id).HasName("audit_log_pkey");

            entity.ToTable("audit_log");

            entity.HasIndex(e => new { e.entity_type_code, e.entity_id, e.created_at }, "idx_audit_log_entity").IsDescending(false, false, true);

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.after_json).HasColumnType("jsonb");
            entity.Property(e => e.before_json).HasColumnType("jsonb");
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.performed_by_user).WithMany(p => p.audit_logs)
                .HasForeignKey(d => d.performed_by_user_id)
                .HasConstraintName("audit_log_performed_by_user_id_fkey");
        });

        modelBuilder.Entity<distribution>(entity =>
        {
            entity.HasKey(e => e.id).HasName("distribution_pkey");

            entity.ToTable("distribution");

            entity.HasIndex(e => e.code, "distribution_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.campaign).WithMany(p => p.distributions)
                .HasForeignKey(d => d.campaign_id)
                .HasConstraintName("distribution_campaign_id_fkey");

            entity.HasOne(d => d.created_by_user).WithMany(p => p.distributions)
                .HasForeignKey(d => d.created_by_user_id)
                .HasConstraintName("distribution_created_by_user_id_fkey");

            entity.HasOne(d => d.household).WithMany(p => p.distributions)
                .HasForeignKey(d => d.household_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("distribution_household_id_fkey");

            entity.HasOne(d => d.linked_incident).WithMany(p => p.distributions)
                .HasForeignKey(d => d.linked_incident_id)
                .HasConstraintName("distribution_linked_incident_id_fkey");

            entity.HasOne(d => d.relief_point).WithMany(p => p.distributions)
                .HasForeignKey(d => d.relief_point_id)
                .HasConstraintName("distribution_relief_point_id_fkey");
        });

        modelBuilder.Entity<distribution_ack>(entity =>
        {
            entity.HasKey(e => e.id).HasName("distribution_ack_pkey");

            entity.ToTable("distribution_ack");

            entity.HasIndex(e => e.distribution_id, "distribution_ack_distribution_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.ack_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.distribution).WithOne(p => p.distribution_ack)
                .HasForeignKey<distribution_ack>(d => d.distribution_id)
                .HasConstraintName("distribution_ack_distribution_id_fkey");
        });

        modelBuilder.Entity<distribution_line>(entity =>
        {
            entity.HasKey(e => e.id).HasName("distribution_line_pkey");

            entity.ToTable("distribution_line");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.qty).HasPrecision(14, 2);

            entity.HasOne(d => d.distribution).WithMany(p => p.distribution_lines)
                .HasForeignKey(d => d.distribution_id)
                .HasConstraintName("distribution_line_distribution_id_fkey");

            entity.HasOne(d => d.item).WithMany(p => p.distribution_lines)
                .HasForeignKey(d => d.item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("distribution_line_item_id_fkey");

            entity.HasOne(d => d.item_lot).WithMany(p => p.distribution_lines)
                .HasForeignKey(d => d.item_lot_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("distribution_line_item_lot_id_fkey");
        });

        modelBuilder.Entity<flood_risk_zone>(entity =>
        {
            entity.HasKey(e => e.id).HasName("flood_risk_zone_pkey");

            entity.ToTable("flood_risk_zone");

            entity.HasIndex(e => e.code, "flood_risk_zone_code_key").IsUnique();

            entity.HasIndex(e => e.geom, "idx_flood_risk_zone_geom").HasMethod("gist");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(MultiPolygon,4326)");

            entity.HasOne(d => d.admin_area).WithMany(p => p.flood_risk_zones)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("flood_risk_zone_admin_area_id_fkey");
        });

        modelBuilder.Entity<household>(entity =>
        {
            entity.HasKey(e => e.id).HasName("household_pkey");

            entity.ToTable("household");

            entity.HasIndex(e => e.code, "household_code_key").IsUnique();

            entity.HasIndex(e => e.geom, "idx_household_geom").HasMethod("gist");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.member_count).HasDefaultValue(1);
            entity.Property(e => e.vulnerable_count).HasDefaultValue(0);

            entity.HasOne(d => d.admin_area).WithMany(p => p.households)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("household_admin_area_id_fkey");
        });

        modelBuilder.Entity<incident>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_pkey");

            entity.ToTable("incident");

            entity.HasIndex(e => e.reporter_phone, "idx_incident_reporter_phone");

            entity.HasIndex(e => new { e.status_code, e.priority_code, e.created_at }, "idx_incident_status_priority_created").IsDescending(false, false, true);

            entity.HasIndex(e => e.code, "incident_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.contact_verified).HasDefaultValue(false);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.estimated_injured_count).HasDefaultValue(0);
            entity.Property(e => e.estimated_victim_count).HasDefaultValue(0);
            entity.Property(e => e.estimated_vulnerable_count).HasDefaultValue(0);
            entity.Property(e => e.incident_type_code).HasDefaultValueSql("'FLOOD'::text");
            entity.Property(e => e.is_sos).HasDefaultValue(false);
            entity.Property(e => e.need_relief).HasDefaultValue(false);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.created_by_user).WithMany(p => p.incidents)
                .HasForeignKey(d => d.created_by_user_id)
                .HasConstraintName("incident_created_by_user_id_fkey");
        });

        modelBuilder.Entity<incident_assessment>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_assessment_pkey");

            entity.ToTable("incident_assessment");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.requires_evacuation).HasDefaultValue(true);
            entity.Property(e => e.requires_medical_support).HasDefaultValue(false);

            entity.HasOne(d => d.assessed_by_user).WithMany(p => p.incident_assessments)
                .HasForeignKey(d => d.assessed_by_user_id)
                .HasConstraintName("incident_assessment_assessed_by_user_id_fkey");

            entity.HasOne(d => d.incident).WithMany(p => p.incident_assessments)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("incident_assessment_incident_id_fkey");
        });

        modelBuilder.Entity<incident_location>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_location_pkey");

            entity.ToTable("incident_location");

            entity.HasIndex(e => e.geom, "idx_incident_location_geom").HasMethod("gist");

            entity.HasIndex(e => e.incident_id, "incident_location_incident_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.flood_depth_m).HasPrecision(5, 2);
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.lat).HasPrecision(9, 6);
            entity.Property(e => e.lng).HasPrecision(9, 6);

            entity.HasOne(d => d.admin_area).WithMany(p => p.incident_locations)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("incident_location_admin_area_id_fkey");

            entity.HasOne(d => d.incident).WithOne(p => p.incident_location)
                .HasForeignKey<incident_location>(d => d.incident_id)
                .HasConstraintName("incident_location_incident_id_fkey");
        });

        modelBuilder.Entity<incident_medium>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_media_pkey");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.uploaded_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.incident).WithMany(p => p.incident_media)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("incident_media_incident_id_fkey");
        });

        modelBuilder.Entity<incident_requirement_skill>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_requirement_skill_pkey");

            entity.ToTable("incident_requirement_skill");

            entity.HasIndex(e => new { e.incident_id, e.skill_id }, "incident_requirement_skill_incident_id_skill_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.incident).WithMany(p => p.incident_requirement_skills)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("incident_requirement_skill_incident_id_fkey");

            entity.HasOne(d => d.skill).WithMany(p => p.incident_requirement_skills)
                .HasForeignKey(d => d.skill_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("incident_requirement_skill_skill_id_fkey");
        });

        modelBuilder.Entity<incident_requirement_vehicle_capability>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_requirement_vehicle_capability_pkey");

            entity.ToTable("incident_requirement_vehicle_capability");

            entity.HasIndex(e => new { e.incident_id, e.vehicle_capability_id }, "incident_requirement_vehicle__incident_id_vehicle_capabilit_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.incident).WithMany(p => p.incident_requirement_vehicle_capabilities)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("incident_requirement_vehicle_capability_incident_id_fkey");

            entity.HasOne(d => d.vehicle_capability).WithMany(p => p.incident_requirement_vehicle_capabilities)
                .HasForeignKey(d => d.vehicle_capability_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("incident_requirement_vehicle_capabil_vehicle_capability_id_fkey");
        });

        modelBuilder.Entity<incident_status_history>(entity =>
        {
            entity.HasKey(e => e.id).HasName("incident_status_history_pkey");

            entity.ToTable("incident_status_history");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.changed_by_user).WithMany(p => p.incident_status_histories)
                .HasForeignKey(d => d.changed_by_user_id)
                .HasConstraintName("incident_status_history_changed_by_user_id_fkey");

            entity.HasOne(d => d.incident).WithMany(p => p.incident_status_histories)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("incident_status_history_incident_id_fkey");
        });

        modelBuilder.Entity<item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("item_pkey");

            entity.ToTable("item");

            entity.HasIndex(e => e.code, "item_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.received_at).HasDefaultValueSql("now()");
            entity.Property(e => e.requires_expiry_tracking).HasDefaultValue(true);
            entity.Property(e => e.requires_lot_tracking).HasDefaultValue(true);

            entity.HasOne(d => d.item_category).WithMany(p => p.items)
                .HasForeignKey(d => d.item_category_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("item_item_category_id_fkey");
        });

        modelBuilder.Entity<item_category>(entity =>
        {
            entity.HasKey(e => e.id).HasName("item_category_pkey");

            entity.ToTable("item_category");

            entity.HasIndex(e => e.code, "item_category_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
        });

        modelBuilder.Entity<item_lot>(entity =>
        {
            entity.HasKey(e => e.id).HasName("item_lot_pkey");

            entity.ToTable("item_lot");

            entity.HasIndex(e => new { e.item_id, e.lot_no }, "item_lot_item_id_lot_no_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.received_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.item).WithMany(p => p.item_lots)
                .HasForeignKey(d => d.item_id)
                .HasConstraintName("item_lot_item_id_fkey");
        });

        modelBuilder.Entity<mission>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_pkey");

            entity.ToTable("mission");

            entity.HasIndex(e => new { e.status_code, e.priority_code, e.created_at }, "idx_mission_status_priority_created").IsDescending(false, false, true);

            entity.HasIndex(e => e.code, "mission_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.coordinator_user).WithMany(p => p.missions)
                .HasForeignKey(d => d.coordinator_user_id)
                .HasConstraintName("mission_coordinator_user_id_fkey");

            entity.HasOne(d => d.incident).WithMany(p => p.missions)
                .HasForeignKey(d => d.incident_id)
                .HasConstraintName("mission_incident_id_fkey");

            entity.HasOne(d => d.primary_team).WithMany(p => p.missions)
                .HasForeignKey(d => d.primary_team_id)
                .HasConstraintName("mission_primary_team_id_fkey");
        });

        modelBuilder.Entity<mission_abort_request>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_abort_request_pkey");

            entity.ToTable("mission_abort_request");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.decided_by_user).WithMany(p => p.mission_abort_requestdecided_by_users)
                .HasForeignKey(d => d.decided_by_user_id)
                .HasConstraintName("mission_abort_request_decided_by_user_id_fkey");

            entity.HasOne(d => d.mission).WithMany(p => p.mission_abort_requests)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_abort_request_mission_id_fkey");

            entity.HasOne(d => d.requested_by_user).WithMany(p => p.mission_abort_requestrequested_by_users)
                .HasForeignKey(d => d.requested_by_user_id)
                .HasConstraintName("mission_abort_request_requested_by_user_id_fkey");
        });

        modelBuilder.Entity<mission_field_report>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_field_report_pkey");

            entity.ToTable("mission_field_report");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.casualty_count).HasDefaultValue(0);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.flood_depth_m).HasPrecision(5, 2);
            entity.Property(e => e.rescued_count).HasDefaultValue(0);
            entity.Property(e => e.unreachable_count).HasDefaultValue(0);

            entity.HasOne(d => d.mission).WithMany(p => p.mission_field_reports)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_field_report_mission_id_fkey");

            entity.HasOne(d => d.reported_by_user).WithMany(p => p.mission_field_reports)
                .HasForeignKey(d => d.reported_by_user_id)
                .HasConstraintName("mission_field_report_reported_by_user_id_fkey");
        });

        modelBuilder.Entity<mission_field_report_medium>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_field_report_media_pkey");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.uploaded_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.mission_field_report).WithMany(p => p.mission_field_report_media)
                .HasForeignKey(d => d.mission_field_report_id)
                .HasConstraintName("mission_field_report_media_mission_field_report_id_fkey");
        });

        modelBuilder.Entity<mission_member>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_member_pkey");

            entity.ToTable("mission_member");

            entity.HasIndex(e => new { e.mission_id, e.team_member_id }, "mission_member_mission_id_team_member_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.mission).WithMany(p => p.mission_members)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_member_mission_id_fkey");

            entity.HasOne(d => d.team_member).WithMany(p => p.mission_members)
                .HasForeignKey(d => d.team_member_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("mission_member_team_member_id_fkey");
        });

        modelBuilder.Entity<mission_status_history>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_status_history_pkey");

            entity.ToTable("mission_status_history");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.changed_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.changed_by_user).WithMany(p => p.mission_status_histories)
                .HasForeignKey(d => d.changed_by_user_id)
                .HasConstraintName("mission_status_history_changed_by_user_id_fkey");

            entity.HasOne(d => d.mission).WithMany(p => p.mission_status_histories)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_status_history_mission_id_fkey");
        });

        modelBuilder.Entity<mission_support_request>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_support_request_pkey");

            entity.ToTable("mission_support_request");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.requested_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.decided_by_user).WithMany(p => p.mission_support_requestdecided_by_users)
                .HasForeignKey(d => d.decided_by_user_id)
                .HasConstraintName("mission_support_request_decided_by_user_id_fkey");

            entity.HasOne(d => d.mission).WithMany(p => p.mission_support_requests)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_support_request_mission_id_fkey");

            entity.HasOne(d => d.requested_by_user).WithMany(p => p.mission_support_requestrequested_by_users)
                .HasForeignKey(d => d.requested_by_user_id)
                .HasConstraintName("mission_support_request_requested_by_user_id_fkey");
        });

        modelBuilder.Entity<mission_team>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_team_pkey");

            entity.ToTable("mission_team");

            entity.HasIndex(e => new { e.mission_id, e.team_id }, "mission_team_mission_id_team_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.assigned_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_primary_team).HasDefaultValue(false);

            entity.HasOne(d => d.mission).WithMany(p => p.mission_teams)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_team_mission_id_fkey");

            entity.HasOne(d => d.team).WithMany(p => p.mission_teams)
                .HasForeignKey(d => d.team_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("mission_team_team_id_fkey");
        });

        modelBuilder.Entity<mission_vehicle>(entity =>
        {
            entity.HasKey(e => e.id).HasName("mission_vehicle_pkey");

            entity.ToTable("mission_vehicle");

            entity.HasIndex(e => new { e.mission_id, e.vehicle_id }, "mission_vehicle_mission_id_vehicle_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.mission).WithMany(p => p.mission_vehicles)
                .HasForeignKey(d => d.mission_id)
                .HasConstraintName("mission_vehicle_mission_id_fkey");

            entity.HasOne(d => d.vehicle).WithMany(p => p.mission_vehicles)
                .HasForeignKey(d => d.vehicle_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("mission_vehicle_vehicle_id_fkey");
        });

        modelBuilder.Entity<notification>(entity =>
        {
            entity.HasKey(e => e.id).HasName("notification_pkey");

            entity.ToTable("notification");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<relief_campaign>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_campaign_pkey");

            entity.ToTable("relief_campaign");

            entity.HasIndex(e => e.code, "relief_campaign_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.admin_area).WithMany(p => p.relief_campaigns)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("relief_campaign_admin_area_id_fkey");

            entity.HasOne(d => d.linked_incident).WithMany(p => p.relief_campaigns)
                .HasForeignKey(d => d.linked_incident_id)
                .HasConstraintName("relief_campaign_linked_incident_id_fkey");
        });

        modelBuilder.Entity<relief_issue>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_issue_pkey");

            entity.ToTable("relief_issue");

            entity.HasIndex(e => e.code, "relief_issue_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.campaign).WithMany(p => p.relief_issues)
                .HasForeignKey(d => d.campaign_id)
                .HasConstraintName("relief_issue_campaign_id_fkey");

            entity.HasOne(d => d.created_by_user).WithMany(p => p.relief_issues)
                .HasForeignKey(d => d.created_by_user_id)
                .HasConstraintName("relief_issue_created_by_user_id_fkey");

            entity.HasOne(d => d.from_warehouse).WithMany(p => p.relief_issues)
                .HasForeignKey(d => d.from_warehouse_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("relief_issue_from_warehouse_id_fkey");

            entity.HasOne(d => d.relief_point).WithMany(p => p.relief_issues)
                .HasForeignKey(d => d.relief_point_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("relief_issue_relief_point_id_fkey");
        });

        modelBuilder.Entity<relief_issue_line>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_issue_line_pkey");

            entity.ToTable("relief_issue_line");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.issue_qty).HasPrecision(14, 2);

            entity.HasOne(d => d.item).WithMany(p => p.relief_issue_lines)
                .HasForeignKey(d => d.item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("relief_issue_line_item_id_fkey");

            entity.HasOne(d => d.item_lot).WithMany(p => p.relief_issue_lines)
                .HasForeignKey(d => d.item_lot_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("relief_issue_line_item_lot_id_fkey");

            entity.HasOne(d => d.relief_issue).WithMany(p => p.relief_issue_lines)
                .HasForeignKey(d => d.relief_issue_id)
                .HasConstraintName("relief_issue_line_relief_issue_id_fkey");
        });

        modelBuilder.Entity<relief_point>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_point_pkey");

            entity.ToTable("relief_point");

            entity.HasIndex(e => e.geom, "idx_relief_point_geom").HasMethod("gist");

            entity.HasIndex(e => e.code, "relief_point_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");

            entity.HasOne(d => d.admin_area).WithMany(p => p.relief_points)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("relief_point_admin_area_id_fkey");

            entity.HasOne(d => d.campaign).WithMany(p => p.relief_points)
                .HasForeignKey(d => d.campaign_id)
                .HasConstraintName("relief_point_campaign_id_fkey");

            entity.HasOne(d => d.manager_user).WithMany(p => p.relief_points)
                .HasForeignKey(d => d.manager_user_id)
                .HasConstraintName("relief_point_manager_user_id_fkey");
        });

        modelBuilder.Entity<relief_request>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_request_pkey");

            entity.ToTable("relief_request");

            entity.HasIndex(e => e.geom, "idx_relief_request_geom").HasMethod("gist");

            entity.HasIndex(e => e.code, "relief_request_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.household_count).HasDefaultValue(0);
            entity.Property(e => e.updated_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.admin_area).WithMany(p => p.relief_requests)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("relief_request_admin_area_id_fkey");

            entity.HasOne(d => d.campaign).WithMany(p => p.relief_requests)
                .HasForeignKey(d => d.campaign_id)
                .HasConstraintName("relief_request_campaign_id_fkey");

            entity.HasOne(d => d.linked_incident).WithMany(p => p.relief_requests)
                .HasForeignKey(d => d.linked_incident_id)
                .HasConstraintName("relief_request_linked_incident_id_fkey");
        });

        modelBuilder.Entity<relief_request_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("relief_request_item_pkey");

            entity.ToTable("relief_request_item");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.approved_qty).HasPrecision(14, 2);
            entity.Property(e => e.requested_qty).HasPrecision(14, 2);

            entity.HasOne(d => d.item).WithMany(p => p.relief_request_items)
                .HasForeignKey(d => d.item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("relief_request_item_item_id_fkey");

            entity.HasOne(d => d.relief_request).WithMany(p => p.relief_request_items)
                .HasForeignKey(d => d.relief_request_id)
                .HasConstraintName("relief_request_item_relief_request_id_fkey");
        });

        modelBuilder.Entity<rescue_ack>(entity =>
        {
            entity.HasKey(e => e.id).HasName("rescue_ack_pkey");

            entity.ToTable("rescue_ack");

            entity.HasIndex(e => e.incident_id, "rescue_ack_incident_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.ack_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.incident).WithOne(p => p.rescue_ack)
                .HasForeignKey<rescue_ack>(d => d.incident_id)
                .HasConstraintName("rescue_ack_incident_id_fkey");
        });

        modelBuilder.Entity<skill>(entity =>
        {
            entity.HasKey(e => e.id).HasName("skill_pkey");

            entity.ToTable("skill");

            entity.HasIndex(e => e.code, "skill_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
        });

        modelBuilder.Entity<stock_alert>(entity =>
        {
            entity.HasKey(e => e.id).HasName("stock_alert_pkey");

            entity.ToTable("stock_alert");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_resolved).HasDefaultValue(false);

            entity.HasOne(d => d.item).WithMany(p => p.stock_alerts)
                .HasForeignKey(d => d.item_id)
                .HasConstraintName("stock_alert_item_id_fkey");

            entity.HasOne(d => d.item_lot).WithMany(p => p.stock_alerts)
                .HasForeignKey(d => d.item_lot_id)
                .HasConstraintName("stock_alert_item_lot_id_fkey");

            entity.HasOne(d => d.warehouse).WithMany(p => p.stock_alerts)
                .HasForeignKey(d => d.warehouse_id)
                .HasConstraintName("stock_alert_warehouse_id_fkey");
        });

        modelBuilder.Entity<stock_balance>(entity =>
        {
            entity.HasKey(e => e.id).HasName("stock_balance_pkey");

            entity.ToTable("stock_balance");

            entity.HasIndex(e => new { e.warehouse_id, e.warehouse_bin_id, e.item_id, e.item_lot_id }, "stock_balance_warehouse_id_warehouse_bin_id_item_id_item_lo_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.qty_on_hand).HasPrecision(14, 2);
            entity.Property(e => e.qty_reserved).HasPrecision(14, 2);

            entity.HasOne(d => d.item).WithMany(p => p.stock_balances)
                .HasForeignKey(d => d.item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_balance_item_id_fkey");

            entity.HasOne(d => d.item_lot).WithMany(p => p.stock_balances)
                .HasForeignKey(d => d.item_lot_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_balance_item_lot_id_fkey");

            entity.HasOne(d => d.warehouse_bin).WithMany(p => p.stock_balances)
                .HasForeignKey(d => d.warehouse_bin_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_balance_warehouse_bin_id_fkey");

            entity.HasOne(d => d.warehouse).WithMany(p => p.stock_balances)
                .HasForeignKey(d => d.warehouse_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_balance_warehouse_id_fkey");
        });

        modelBuilder.Entity<stock_transaction>(entity =>
        {
            entity.HasKey(e => e.id).HasName("stock_transaction_pkey");

            entity.ToTable("stock_transaction");

            entity.HasIndex(e => e.code, "stock_transaction_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");

            entity.HasOne(d => d.created_by_user).WithMany(p => p.stock_transactions)
                .HasForeignKey(d => d.created_by_user_id)
                .HasConstraintName("stock_transaction_created_by_user_id_fkey");

            entity.HasOne(d => d.warehouse).WithMany(p => p.stock_transactions)
                .HasForeignKey(d => d.warehouse_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_transaction_warehouse_id_fkey");
        });

        modelBuilder.Entity<stock_transaction_line>(entity =>
        {
            entity.HasKey(e => e.id).HasName("stock_transaction_line_pkey");

            entity.ToTable("stock_transaction_line");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.qty).HasPrecision(14, 2);

            entity.HasOne(d => d.from_bin).WithMany(p => p.stock_transaction_linefrom_bins)
                .HasForeignKey(d => d.from_bin_id)
                .HasConstraintName("stock_transaction_line_from_bin_id_fkey");

            entity.HasOne(d => d.item).WithMany(p => p.stock_transaction_lines)
                .HasForeignKey(d => d.item_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_transaction_line_item_id_fkey");

            entity.HasOne(d => d.item_lot).WithMany(p => p.stock_transaction_lines)
                .HasForeignKey(d => d.item_lot_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("stock_transaction_line_item_lot_id_fkey");

            entity.HasOne(d => d.stock_transaction).WithMany(p => p.stock_transaction_lines)
                .HasForeignKey(d => d.stock_transaction_id)
                .HasConstraintName("stock_transaction_line_stock_transaction_id_fkey");

            entity.HasOne(d => d.to_bin).WithMany(p => p.stock_transaction_lineto_bins)
                .HasForeignKey(d => d.to_bin_id)
                .HasConstraintName("stock_transaction_line_to_bin_id_fkey");
        });

        modelBuilder.Entity<team>(entity =>
        {
            entity.HasKey(e => e.id).HasName("team_pkey");

            entity.ToTable("team");

            entity.HasIndex(e => e.current_location, "idx_team_current_location").HasMethod("gist");

            entity.HasIndex(e => e.code, "team_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.current_location).HasColumnType("geometry(Point,4326)");
            entity.Property(e => e.max_parallel_missions).HasDefaultValue(2);

            entity.HasOne(d => d.home_admin_area).WithMany(p => p.teams)
                .HasForeignKey(d => d.home_admin_area_id)
                .HasConstraintName("team_home_admin_area_id_fkey");

            entity.HasOne(d => d.leader_user).WithMany(p => p.teams)
                .HasForeignKey(d => d.leader_user_id)
                .HasConstraintName("team_leader_user_id_fkey");
        });

        modelBuilder.Entity<team_member>(entity =>
        {
            entity.HasKey(e => e.id).HasName("team_member_pkey");

            entity.ToTable("team_member");

            entity.HasIndex(e => e.last_known_location, "idx_team_member_last_known_location").HasMethod("gist");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.is_team_leader).HasDefaultValue(false);
            entity.Property(e => e.last_known_location).HasColumnType("geometry(Point,4326)");

            entity.HasOne(d => d.team).WithMany(p => p.team_members)
                .HasForeignKey(d => d.team_id)
                .HasConstraintName("team_member_team_id_fkey");

            entity.HasOne(d => d.user).WithMany(p => p.team_members)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("team_member_user_id_fkey");
        });

        modelBuilder.Entity<team_member_skill>(entity =>
        {
            entity.HasKey(e => e.id).HasName("team_member_skill_pkey");

            entity.ToTable("team_member_skill");

            entity.HasIndex(e => new { e.team_member_id, e.skill_id }, "team_member_skill_team_member_id_skill_id_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.is_primary).HasDefaultValue(false);

            entity.HasOne(d => d.skill).WithMany(p => p.team_member_skills)
                .HasForeignKey(d => d.skill_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("team_member_skill_skill_id_fkey");

            entity.HasOne(d => d.team_member).WithMany(p => p.team_member_skills)
                .HasForeignKey(d => d.team_member_id)
                .HasConstraintName("team_member_skill_team_member_id_fkey");
        });

        modelBuilder.Entity<user_notification>(entity =>
        {
            entity.HasKey(e => e.id).HasName("user_notification_pkey");

            entity.ToTable("user_notification");

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.is_read).HasDefaultValue(false);

            entity.HasOne(d => d.notification).WithMany(p => p.user_notifications)
                .HasForeignKey(d => d.notification_id)
                .HasConstraintName("user_notification_notification_id_fkey");

            entity.HasOne(d => d.user).WithMany(p => p.user_notifications)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("user_notification_user_id_fkey");
        });

        modelBuilder.Entity<vehicle>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vehicle_pkey");

            entity.ToTable("vehicle");

            entity.HasIndex(e => e.current_location, "idx_vehicle_current_location").HasMethod("gist");

            entity.HasIndex(e => e.code, "vehicle_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.capacity_person).HasDefaultValue(0);
            entity.Property(e => e.capacity_weight_kg).HasPrecision(10, 2);
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.current_location).HasColumnType("geometry(Point,4326)");

            entity.HasOne(d => d.team).WithMany(p => p.vehicles)
                .HasForeignKey(d => d.team_id)
                .HasConstraintName("vehicle_team_id_fkey");

            entity.HasOne(d => d.vehicle_type).WithMany(p => p.vehicles)
                .HasForeignKey(d => d.vehicle_type_id)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("vehicle_vehicle_type_id_fkey");

            entity.HasMany(d => d.vehicle_capabilities).WithMany(p => p.vehicles)
                .UsingEntity<Dictionary<string, object>>(
                    "vehicle_vehicle_capability",
                    r => r.HasOne<vehicle_capability>().WithMany()
                        .HasForeignKey("vehicle_capability_id")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("vehicle_vehicle_capability_vehicle_capability_id_fkey"),
                    l => l.HasOne<vehicle>().WithMany()
                        .HasForeignKey("vehicle_id")
                        .HasConstraintName("vehicle_vehicle_capability_vehicle_id_fkey"),
                    j =>
                    {
                        j.HasKey("vehicle_id", "vehicle_capability_id").HasName("vehicle_vehicle_capability_pkey");
                        j.ToTable("vehicle_vehicle_capability");
                    });
        });

        modelBuilder.Entity<vehicle_capability>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vehicle_capability_pkey");

            entity.ToTable("vehicle_capability");

            entity.HasIndex(e => e.code, "vehicle_capability_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
        });

        modelBuilder.Entity<vehicle_type>(entity =>
        {
            entity.HasKey(e => e.id).HasName("vehicle_type_pkey");

            entity.ToTable("vehicle_type");

            entity.HasIndex(e => e.code, "vehicle_type_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
        });

        modelBuilder.Entity<warehouse>(entity =>
        {
            entity.HasKey(e => e.id).HasName("warehouse_pkey");

            entity.ToTable("warehouse");

            entity.HasIndex(e => e.geom, "idx_warehouse_geom").HasMethod("gist");

            entity.HasIndex(e => e.code, "warehouse_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();
            entity.Property(e => e.created_at).HasDefaultValueSql("now()");
            entity.Property(e => e.geom).HasColumnType("geometry(Point,4326)");

            entity.HasOne(d => d.admin_area).WithMany(p => p.warehouses)
                .HasForeignKey(d => d.admin_area_id)
                .HasConstraintName("warehouse_admin_area_id_fkey");

            entity.HasOne(d => d.manager_user).WithMany(p => p.warehouses)
                .HasForeignKey(d => d.manager_user_id)
                .HasConstraintName("warehouse_manager_user_id_fkey");
        });

        modelBuilder.Entity<warehouse_bin>(entity =>
        {
            entity.HasKey(e => e.id).HasName("warehouse_bin_pkey");

            entity.ToTable("warehouse_bin");

            entity.HasIndex(e => new { e.warehouse_zone_id, e.code }, "warehouse_bin_warehouse_zone_id_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.warehouse_zone).WithMany(p => p.warehouse_bins)
                .HasForeignKey(d => d.warehouse_zone_id)
                .HasConstraintName("warehouse_bin_warehouse_zone_id_fkey");
        });

        modelBuilder.Entity<warehouse_zone>(entity =>
        {
            entity.HasKey(e => e.id).HasName("warehouse_zone_pkey");

            entity.ToTable("warehouse_zone");

            entity.HasIndex(e => new { e.warehouse_id, e.code }, "warehouse_zone_warehouse_id_code_key").IsUnique();

            entity.Property(e => e.id).ValueGeneratedNever();

            entity.HasOne(d => d.warehouse).WithMany(p => p.warehouse_zones)
                .HasForeignKey(d => d.warehouse_id)
                .HasConstraintName("warehouse_zone_warehouse_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

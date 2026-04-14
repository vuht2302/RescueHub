using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vi_tri_su_co
{
    public Guid id { get; set; }

    public Guid su_co_id { get; set; }

    public string? address_text { get; set; }

    public string? landmark { get; set; }

    public Guid? khu_vuc_hanh_chinh_id { get; set; }

    public decimal? lat { get; set; }

    public decimal? lng { get; set; }

    public Point? geom { get; set; }

    public string? location_source_code { get; set; }

    public decimal? accuracy_meter { get; set; }

    public bool is_current { get; set; }

    public DateTime captured_at { get; set; }

    public Guid? captured_by { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual nguoi_dung? captured_byNavigation { get; set; }

    public virtual khu_vuc_hanh_chinh? khu_vuc_hanh_chinh { get; set; }

    public virtual su_co su_co { get; set; } = null!;
}

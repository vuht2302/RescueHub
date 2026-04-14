using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class ho_dan
{
    public Guid id { get; set; }

    public string household_code { get; set; } = null!;

    public string head_name { get; set; } = null!;

    public string? phone { get; set; }

    public string? address { get; set; }

    public Guid? khu_vuc_hanh_chinh_id { get; set; }

    public decimal? lat { get; set; }

    public decimal? lng { get; set; }

    public Point? geom { get; set; }

    public int? member_count { get; set; }

    public int? vulnerable_count { get; set; }

    public Guid? cong_dan_id { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual cong_dan? cong_dan { get; set; }

    public virtual khu_vuc_hanh_chinh? khu_vuc_hanh_chinh { get; set; }

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();
}

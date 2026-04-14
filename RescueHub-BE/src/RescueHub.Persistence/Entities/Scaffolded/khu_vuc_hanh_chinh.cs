using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class khu_vuc_hanh_chinh
{
    public Guid id { get; set; }

    public Guid? parent_id { get; set; }

    public string level_code { get; set; } = null!;

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public MultiPolygon? geom { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<khu_vuc_hanh_chinh> Inverseparent { get; set; } = new List<khu_vuc_hanh_chinh>();

    public virtual ICollection<chien_dich_cuu_tro> chien_dich_cuu_tros { get; set; } = new List<chien_dich_cuu_tro>();

    public virtual ICollection<dia_diem> dia_diems { get; set; } = new List<dia_diem>();

    public virtual ICollection<diem_cuu_tro> diem_cuu_tros { get; set; } = new List<diem_cuu_tro>();

    public virtual ICollection<ho_dan> ho_dans { get; set; } = new List<ho_dan>();

    public virtual khu_vuc_hanh_chinh? parent { get; set; }

    public virtual ICollection<vi_tri_su_co> vi_tri_su_cos { get; set; } = new List<vi_tri_su_co>();

    public virtual ICollection<yeu_cau_cuu_tro> yeu_cau_cuu_tros { get; set; } = new List<yeu_cau_cuu_tro>();
}
